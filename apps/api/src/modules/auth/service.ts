import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { config } from '../../config';
import { User } from '../../models/User';
import { Tenant } from '../../models/Tenant';
import { PasswordResetToken } from '../../models/PasswordResetToken';
import { AppError } from '../../middleware/error-handler';
import { UserCreateInput, UserLoginInput, AuthTokens } from '@school-platform/shared';

export class AuthService {
  static async register(
    input: UserCreateInput,
  ): Promise<{ user: any; tokens: AuthTokens }> {
    if (!mongoose.Types.ObjectId.isValid(input.tenantId)) {
      throw new AppError('Invalid tenant ID format.', 400);
    }

    const tenant = await Tenant.findOne({ _id: input.tenantId, status: 'active' });
    if (!tenant) {
      throw new AppError('Tenant not found or inactive', 400);
    }

    // Global unique email — one person = one account
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw new AppError('User already exists with this email', 409);
    }

    // FIXED B20: enforce admin-first rule.
    // If no admin exists for this tenant yet, force the role to 'admin'.
    const adminExists = await User.exists({
      tenantId: input.tenantId,
      role: 'admin',
      status: 'active',
    });

    let finalRole = input.role;
    if (!adminExists) {
      finalRole = 'admin';
      console.log('🔐 No admin for tenant — forcing role to admin for', input.email);
    }

    const user = await User.create({
      tenantId: input.tenantId,
      email: input.email,
      passwordHash: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      role: finalRole,
    });

    console.log('✅ User created:', {
      id: user._id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    // Create role-specific profile document
    await this.createRoleProfile(user, input);

    const tokens = this.generateTokens(user.id, user.tenantId, user.email, user.role);

    const { passwordHash: _passwordHash, ...userObj } = user.toObject();

    return { user: userObj, tokens };
  }

  /**
   * Create the Student/Teacher profile document matching the user's role.
   * Failures are logged but do not abort registration — the user can
   * complete their profile later without losing their account.
   */
  private static async createRoleProfile(user: any, input: UserCreateInput) {
    try {
      if (user.role === 'student') {
        const { Student } = await import('../../models/Student');
        const { generateAdmissionNo } = await import('../../utils/admission');

        const admissionNo = await generateAdmissionNo(user.tenantId);

        await Student.create({
          tenantId: user.tenantId,
          userId: user._id.toString(),
          admissionNo,
          rollNo: admissionNo,
          firstName: user.firstName,
          lastName: user.lastName,
          grade: (input as any).grade || 'Unassigned',
          section: (input as any).section || '',
          dateOfBirth: (input as any).dateOfBirth
            ? new Date((input as any).dateOfBirth)
            : new Date('2010-01-01'),
          gender: (input as any).gender || 'other',
          guardians: (input as any).parentName
            ? [
                {
                  name: (input as any).parentName,
                  phone: (input as any).parentPhone || '',
                  email: (input as any).parentEmail || '',
                  relationship: 'guardian',
                  isVerified: false,
                },
              ]
            : [],
          address: {
            city: 'N/A',
            state: 'N/A',
            country: 'India',
            postalCode: '000000',
          },
          emergencyContact: {
            name: (input as any).parentName || user.firstName,
            phone: (input as any).parentPhone || '0000000000',
            relationship: 'guardian',
          },
          status: 'active',
          isDeleted: false,
        });
      }

      if (user.role === 'teacher') {
        const { Teacher } = await import('../../models/Teacher');
        const { generateEmployeeId } = await import('../../utils/employee');

        const employeeId = await generateEmployeeId(user.tenantId);

        await Teacher.create({
          tenantId: user.tenantId,
          userId: user._id.toString(),
          employeeId,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: (input as any).dateOfBirth
            ? new Date((input as any).dateOfBirth)
            : new Date('1990-01-01'),
          gender: (input as any).gender || 'other',
          phone: (input as any).phone || '0000000000',
          email: user.email,
          address: {
            city: 'N/A',
            state: 'N/A',
            country: 'India',
            postalCode: '000000',
          },
          qualifications: [],
          experience: [],
          subjects: [],
          assignedSections: [],
          specialization: [],
          joiningDate: (input as any).joiningDate
            ? new Date((input as any).joiningDate)
            : new Date(),
          employmentType: 'permanent',
          emergencyContact: {
            name: user.firstName,
            phone: '0000000000',
            relationship: 'self',
          },
          status: 'active',
          isDeleted: false,
        });
      }

      // Guardians don't have their own profile document — they're linked
      // to students via Student.guardians[].userId, which is set during
      // the guardian registration flow (StepGuardianForm).
    } catch (profileError) {
      console.error('❌ Failed to create role profile:', profileError);
    }
  }

  static async login(
    input: UserLoginInput,
  ): Promise<{ user: any; tokens: AuthTokens }> {
    const user = await User.findOne({ email: input.email, status: 'active' });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = this.generateTokens(user.id, user.tenantId, user.email, user.role);

    const { passwordHash: _passwordHash, ...userObj } = user.toObject();

    return { user: userObj, tokens };
  }

  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

      const user = await User.findOne({ _id: decoded.userId, status: 'active' });
      if (!user) {
        throw new AppError('Invalid refresh token', 401);
      }

      return this.generateTokens(user.id, user.tenantId, user.email, user.role);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  private static generateTokens(
    userId: string,
    tenantId: string,
    email: string,
    role: string,
  ): AuthTokens {
    const payload = { userId, tenantId, email, role };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiry as SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry as SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  }

  static async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email, status: 'active' });
    if (!user) {
      // Silently succeed to prevent email enumeration
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');

    // Invalidate prior tokens
    await PasswordResetToken.deleteMany({ userId: user.id });

    // Persist new token with 1-hour TTL
    await PasswordResetToken.create({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      used: false,
    });

    console.log('🔑 Reset token generated for:', email);
    console.log('📧 Reset token (dev):', token);
    console.log(`🔗 Reset link: http://localhost:5173/reset-password?token=${token}`);
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await PasswordResetToken.findOne({ token, used: false });

    if (!record) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    if (record.expiresAt < new Date()) {
      await PasswordResetToken.deleteOne({ _id: record._id });
      throw new AppError('Reset token has expired', 400);
    }

    const user = await User.findById(record.userId);
    if (!user) {
      await PasswordResetToken.deleteOne({ _id: record._id });
      throw new AppError('User not found', 404);
    }

    user.passwordHash = newPassword;
    await user.save();

    record.used = true;
    await record.save();
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    user.passwordHash = newPassword;
    await user.save();
  }
}