import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { User } from '../../models/User';
import { Tenant } from '../../models/Tenant';
import { AppError } from '../../middleware/error-handler';
import { UserCreateInput, UserLoginInput, AuthTokens } from '@school-platform/shared';
import crypto from 'crypto';
import { PasswordResetToken } from '../../models/PasswordResetToken';

export class AuthService {
  static async register(input: UserCreateInput): Promise<{ user: any; tokens: AuthTokens }> {
    if (!mongoose.Types.ObjectId.isValid(input.tenantId)) {
      throw new AppError('Invalid tenant ID format. Please use a valid 24-character hex string.', 400);
    }

    // Check if tenant exists
    const tenant = await Tenant.findOne({ _id: input.tenantId, status: 'active' });
    if (!tenant) {
      throw new AppError('Tenant not found or inactive', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw new AppError('User already exists with this email', 409);
    }

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

    // Create user
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

    const tokens = this.generateTokens(user.id, user.tenantId, user.email, user.role);

    const { passwordHash: _passwordHash, ...userObj } = user.toObject();

    return { user: userObj, tokens };
  }

  static async login(input: UserLoginInput): Promise<{ user: any; tokens: AuthTokens }> {
    console.log('🔍 Login service called for:', input.email);

    const user = await User.findOne({ email: input.email, status: 'active' });
    if (!user) {
      console.error('❌ User not found:', input.email);
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      console.error('❌ Invalid password for:', input.email);
      throw new AppError('Invalid email or password', 401);
    }

    user.lastLoginAt = new Date();
    await user.save();

    console.log('✅ Login successful for:', input.email);

    const tokens = this.generateTokens(user.id, user.tenantId, user.email, user.role);

    const { passwordHash: _passwordHash, ...userObj } = user.toObject();

    return { user: userObj, tokens };
  }

  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    console.log('🔍 Refresh token service called');

    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

      console.log('✅ Refresh token decoded for user:', decoded.email);

      const user = await User.findOne({
        _id: decoded.userId,
        status: 'active'
      });

      if (!user) {
        console.error('❌ User not found for refresh token');
        throw new AppError('Invalid refresh token', 401);
      }

      console.log('✅ User found, generating new tokens');
      return this.generateTokens(user.id, user.tenantId, user.email, user.role);
    } catch (error) {
      console.error('❌ Refresh token error:', error);
      throw new AppError('Invalid refresh token', 401);
    }
  }

  private static generateTokens(
    userId: string,
    tenantId: string,
    email: string,
    role: string
  ): AuthTokens {
    const payload = { userId, tenantId, email, role };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiry as SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry as SignOptions['expiresIn'],
    });

    console.log('🔑 Tokens generated for:', email);

    return { accessToken, refreshToken };
  }

  static async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email, status: 'active' });
    if (!user) {
      // Silently succeed to prevent email enumeration
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');

    // Invalidate any prior tokens for this user
    await PasswordResetToken.deleteMany({ userId: user.id });

    // FIXED B19: persist reset token in DB, 1-hour TTL
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

    // Mark as used so it can't be replayed
    record.used = true;
    await record.save();
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    console.log('🔍 Change password service called for user:', userId);

    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found:', userId);
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      console.error('❌ Invalid current password for user:', userId);
      throw new AppError('Current password is incorrect', 401);
    }

    user.passwordHash = newPassword;
    await user.save();

    console.log('✅ Password changed successfully for user:', userId);
  }
}