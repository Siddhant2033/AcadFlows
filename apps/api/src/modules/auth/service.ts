import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { config } from '../../config';
import { User } from '../../models/User';
import { Tenant } from '../../models/Tenant';
import { PasswordResetToken } from '../../models/PasswordResetToken';
import { AppError } from '../../middleware/error-handler';
import { sendPasswordResetEmail } from '../../services/email.service';
import { UserCreateInput, UserLoginInput, AuthTokens } from '@acadflows/shared';

/* ─────────────────────────────────────────────────────────────
   Helper — is this email the platform admin?
   ───────────────────────────────────────────────────────────── */

function isPlatformAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  const adminEmail = config.platformAdmin.email;
  if (!adminEmail) return false;
  return email.toLowerCase().trim() === adminEmail.toLowerCase().trim();
}

export class AuthService {
  /* ═══════════════════════════════════════════════════════════
     REGISTER
     ═══════════════════════════════════════════════════════════ */

  static async register(
    input: UserCreateInput,
  ): Promise<{ user: any; tokens: AuthTokens }> {
    if (!mongoose.Types.ObjectId.isValid(input.tenantId)) {
      throw new AppError('Invalid tenant ID format.', 400);
    }

    const tenant = await Tenant.findOne({
      _id: input.tenantId,
    });
    if (!tenant) {
      throw new AppError('Tenant not found', 400);
    }

    const registeringPlatformAdmin = isPlatformAdminEmail(input.email);

    if (tenant.status !== 'active' && !registeringPlatformAdmin) {
      throw new AppError(
        'This school is not active yet. Please wait for approval.',
        403,
      );
    }

    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw new AppError('User already exists with this email', 409);
    }

    /* ═══════════════════════════════════════════════════════════
       STUDENT VERIFICATION PATH
       ═══════════════════════════════════════════════════════════
       A student can arrive via two paths:
         (A) Verified — passed /students/verify-identity, so
             `verificationData.studentId` is present. Link the new
             User to the existing Student record.
         (B) Unverified — no existing record. Create a fresh
             Student from the form data (grade + sectionId required
             by the validation schema in this case).
       ═══════════════════════════════════════════════════════════ */

    let verifiedStudent: any = null;

    if (input.role === 'student') {
      const anyInput: any = input;
      const verifiedStudentId: string | undefined =
        anyInput.verificationData?.studentId ||
        anyInput.verifiedStudentId;

      if (verifiedStudentId) {
        const { Student } = await import('../../models/Student');

        const student = await Student.findOne({
          _id: verifiedStudentId,
          tenantId: input.tenantId,
          isDeleted: false,
          status: 'active',
        });

        if (!student) {
          throw new AppError(
            'Verified student record not found for this school.',
            400,
          );
        }

        const { User: UserModel } = await import('../../models/User');
        const existing = await UserModel.findById(student.userId).select(
          'status',
        );
        if (existing && existing.status !== 'inactive') {
          throw new AppError(
            'An account already exists for this student.',
            409,
          );
        }

        verifiedStudent = student;

        // Force the register flow to use the student record's identifiers.
        input.grade = student.grade;
        input.section = student.section || '';
        input.sectionId = student.sectionId || '';
      }
      // else: unverified path — trust the form data. Validation
      // has already guaranteed grade + sectionId are present.
    }

    /* ═══════════════════════════════════════════════════════════
       TEACHER EMAIL DOMAIN WHITELIST
       ═══════════════════════════════════════════════════════════ */

    if (input.role === 'teacher') {
      const allowed = tenant.settings?.allowedTeacherEmailDomains || [];
      if (allowed.length > 0) {
        const domain = input.email.split('@')[1]?.toLowerCase() || '';
        const ok = allowed.some(d => {
          const norm = d.replace(/^@/, '').toLowerCase();
          return domain === norm || domain.endsWith(`.${norm}`);
        });
        if (!ok) {
          throw new AppError(
            `Teacher registration is restricted to: ${allowed
              .map(d => `@${d}`)
              .join(', ')}`,
            403,
          );
        }
      }
    }

    /* ═══════════════════════════════════════════════════════════
       AUTO-APPROVAL RULES
       ═══════════════════════════════════════════════════════════ */

    const adminExists = await User.exists({
      tenantId: input.tenantId,
      role: 'admin',
      status: 'active',
    });

    let finalRole = input.role;
    let initialStatus: 'pending' | 'active' = 'pending';
    let approvedBy: string | undefined;
    let approvedAt: Date | undefined;

    if (!adminExists || registeringPlatformAdmin) {
      finalRole = 'admin';
      initialStatus = 'active';
      approvedBy = registeringPlatformAdmin ? 'platform-admin' : 'system';
      approvedAt = new Date();
      console.log(
        `🔐 Auto-approving admin for ${input.email} (${
          registeringPlatformAdmin ? 'platform admin' : 'first admin'
        })`,
      );
    }

    const user = await User.create({
      tenantId: input.tenantId,
      email: input.email,
      passwordHash: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      role: finalRole,
      status: initialStatus,
      approvedBy,
      approvedAt,
      phone: input.phone,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      gender: input.gender,
    });

    console.log('✅ User created:', {
      id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
      tenantId: user.tenantId,
    });

    if (registeringPlatformAdmin && tenant.status !== 'active') {
      tenant.status = 'active';
      tenant.approvedBy = 'platform-admin';
      tenant.approvedAt = new Date();
      tenant.emailVerified = true;
      await tenant.save();
      console.log(
        `✅ Tenant "${tenant.name}" auto-approved for platform admin`,
      );
    }

    // Create role-specific profile — passing verifiedStudent when available.
    await this.createRoleProfile(user, input, verifiedStudent);

    if (finalRole === 'guardian') {
      await this.linkGuardianToStudents(user, input);
    }

    const tokens = this.generateTokens(
      user.id,
      user.tenantId,
      user.email,
      user.role,
    );

    const { passwordHash: _passwordHash, ...userObj } = user.toObject();

    const responseUser = {
      ...userObj,
      isPlatformAdmin: registeringPlatformAdmin,
    };

    return { user: responseUser, tokens };
  }

  /* ═══════════════════════════════════════════════════════════
     ROLE PROFILE CREATION
     ═══════════════════════════════════════════════════════════ */

  private static async createRoleProfile(
    user: any,
    input: UserCreateInput,
    verifiedStudent?: any,
  ) {
    try {
      /* ─────────────── Student ─────────────── */

      if (user.role === 'student') {
        const { Student } = await import('../../models/Student');
        const { AcademicYear } = await import('../../models/AcademicYear');
        const { generateAdmissionNo } = await import('../../utils/admission');

        // ── Path A: verified student — link the new User ──
        if (verifiedStudent) {
          verifiedStudent.userId = user._id.toString();
          verifiedStudent.status =
            user.status === 'active' ? 'active' : 'pending';
          verifiedStudent.approvedBy = user.approvedBy;
          verifiedStudent.approvedAt = user.approvedAt;
          await verifiedStudent.save();

          console.log('✅ Linked new user to existing student:', {
            userId: user._id,
            studentId: verifiedStudent._id,
            status: verifiedStudent.status,
          });
          return;
        }

        // ── Path B: unverified — create a new Student record ──
        const admissionNo = await generateAdmissionNo(user.tenantId);

        const address =
          input.address && (input.address.city || input.address.state)
            ? {
                street: input.address.street || '',
                city: input.address.city || '',
                state: input.address.state || '',
                country: input.address.country || 'India',
                postalCode: input.address.postalCode || '',
              }
            : {
                city: 'N/A',
                state: 'N/A',
                country: 'India',
                postalCode: '000000',
              };

        // Roll number: attempt to generate from the section code, else
        // fall back to admission number.
        let rollNo = admissionNo;
        if (input.sectionId) {
          const { Section } = await import('../../models/Section');
          const section = await Section.findOne({
            _id: input.sectionId,
            tenantId: user.tenantId,
          })
            .select('code')
            .lean();

          if (section?.code) {
            const count = await Student.countDocuments({
              tenantId: user.tenantId,
              sectionId: input.sectionId,
              isDeleted: false,
            });
            rollNo = `${section.code}${String(count + 1).padStart(3, '0')}`;
          }
        }

        const enrollments: any[] = [];
        if (input.sectionId) {
          const currentYear = await AcademicYear.findOne({
            tenantId: user.tenantId,
            isCurrent: true,
          });

          if (currentYear) {
            enrollments.push({
              academicYearId: currentYear._id.toString(),
              sectionId: input.sectionId,
              rollNo,
              enrollmentDate: new Date(),
              status: 'active',
            });
          }
        }

        await Student.create({
          tenantId: user.tenantId,
          userId: user._id.toString(),
          admissionNo,
          rollNo,
          firstName: user.firstName,
          lastName: user.lastName,
          grade: input.grade || 'Unassigned',
          section: input.section || '',
          sectionId: input.sectionId || undefined,
          dateOfBirth: input.dateOfBirth
            ? new Date(input.dateOfBirth)
            : new Date('2010-01-01'),
          gender: input.gender || 'other',
          guardians: input.parentName
            ? [
                {
                  name: input.parentName,
                  phone: input.parentPhone || '',
                  email: input.parentEmail || '',
                  relationship: 'guardian',
                  isVerified: false,
                },
              ]
            : [],
          address,
          emergencyContact: {
            name: input.parentName || user.firstName,
            phone: input.parentPhone || '0000000000',
            relationship: 'guardian',
          },
          enrollments,
          status: user.status === 'active' ? 'active' : 'pending',
          approvedBy: user.approvedBy,
          approvedAt: user.approvedAt,
          isDeleted: false,
        });

        console.log('✅ Student profile created (unverified path):', {
          userId: user._id,
          admissionNo,
          rollNo,
          status: user.status,
        });
        return;
      }

      /* ─────────────── Teacher ─────────────── */

      if (user.role === 'teacher') {
        const { Teacher } = await import('../../models/Teacher');
        const { generateEmployeeId } = await import('../../utils/employee');

        const employeeId = await generateEmployeeId(user.tenantId);

        const address =
          input.address && (input.address.city || input.address.state)
            ? {
                street: input.address.street || '',
                city: input.address.city || '',
                state: input.address.state || '',
                country: input.address.country || 'India',
                postalCode: input.address.postalCode || '',
              }
            : {
                city: 'N/A',
                state: 'N/A',
                country: 'India',
                postalCode: '000000',
              };

        const qualifications: any[] = input.qualification
          ? [
              {
                degree: input.qualification,
                institution: 'N/A',
                year: new Date().getFullYear(),
              },
            ]
          : [];

        const experience: any[] = [];
        if (
          input.experience !== undefined &&
          input.experience !== null &&
          input.experience !== ''
        ) {
          experience.push({
            institution: 'N/A',
            position: 'Teacher',
            fromDate: new Date(),
            isCurrent: true,
            responsibilities: String(input.experience),
          });
        }

        const subjects: string[] = input.subject ? [input.subject] : [];

        await Teacher.create({
          tenantId: user.tenantId,
          userId: user._id.toString(),
          employeeId,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: input.dateOfBirth
            ? new Date(input.dateOfBirth)
            : new Date('1990-01-01'),
          gender: input.gender || 'other',
          phone: input.phone || '0000000000',
          email: user.email,
          address,
          qualifications,
          experience,
          subjects,
          assignedSections: [],
          specialization: [],
          joiningDate: input.joiningDate
            ? new Date(input.joiningDate)
            : new Date(),
          employmentType: 'permanent',
          emergencyContact: {
            name: user.firstName,
            phone: '0000000000',
            relationship: 'self',
          },
          status: user.status === 'active' ? 'active' : 'pending',
          approvedBy: user.approvedBy,
          approvedAt: user.approvedAt,
          isDeleted: false,
        });

        console.log('✅ Teacher profile created:', {
          userId: user._id,
          employeeId,
          status: user.status,
        });
      }
    } catch (profileError) {
      console.error('❌ Failed to create role profile:', profileError);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     GUARDIAN LINKING
     ═══════════════════════════════════════════════════════════ */

  private static async linkGuardianToStudents(
    user: any,
    input: UserCreateInput,
  ) {
    try {
      if (!input.children || input.children.length === 0) {
        console.log('ℹ️  Guardian registered with no children to link');
        return;
      }

      const { Student } = await import('../../models/Student');

      let linked = 0;

      for (const child of input.children) {
        if (!child.studentId) continue;

        const student = await Student.findOne({
          _id: child.studentId,
          tenantId: input.tenantId,
          isDeleted: false,
        });

        if (!student) {
          console.warn(
            '⚠️  Student not found for guardian link:',
            child.studentId,
          );
          continue;
        }

        const alreadyLinked = student.guardians.some(
          g => g.userId === user._id.toString(),
        );

        if (alreadyLinked) {
          console.log(
            'ℹ️  Guardian already linked to student:',
            child.studentId,
          );
          continue;
        }

        student.guardians.push({
          userId: user._id.toString(),
          name: `${user.firstName} ${user.lastName}`,
          phone: input.phone || '',
          email: user.email,
          relationship: (input.relationship as any) || 'guardian',
          occupation: input.occupation || '',
          isVerified: false,
        });

        await student.save();
        linked++;

        console.log(
          `✅ Linked guardian ${user.email} to student ${student.firstName} ${student.lastName}`,
        );
      }

      console.log(`✅ Guardian linked to ${linked} student(s)`);
    } catch (linkError) {
      console.error('❌ Failed to link guardian to students:', linkError);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     LOGIN
     ═══════════════════════════════════════════════════════════ */

  static async login(
    input: UserLoginInput,
  ): Promise<{ user: any; tokens: AuthTokens }> {
    const user = await User.findOne({ email: input.email });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPlatformAdmin = isPlatformAdminEmail(user.email);

    if (!isPlatformAdmin) {
      if (user.status === 'pending') {
        throw new AppError(
          'Your account is pending approval. You will be notified once approved.',
          403,
        );
      }
      if (user.status === 'rejected') {
        throw new AppError(
          'Your account registration was not approved. Contact your school administrator.',
          403,
        );
      }
      if (user.status === 'suspended') {
        throw new AppError(
          'Your account has been suspended. Contact your school administrator.',
          403,
        );
      }
      if (user.status !== 'active') {
        throw new AppError('Account is not active', 403);
      }
    } else {
      console.log(`🔓 Platform admin login: ${user.email}`);
    }

    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = this.generateTokens(
      user.id,
      user.tenantId,
      user.email,
      user.role,
    );

    const { passwordHash: _passwordHash, ...userObj } = user.toObject();

    const responseUser = {
      ...userObj,
      isPlatformAdmin,
    };

    return { user: responseUser, tokens };
  }

  /* ═══════════════════════════════════════════════════════════
     REFRESH TOKEN
     ═══════════════════════════════════════════════════════════ */

  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        config.jwt.refreshSecret,
      ) as any;

      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new AppError('Invalid refresh token', 401);
      }

      const isPlatformAdmin = isPlatformAdminEmail(user.email);
      if (!isPlatformAdmin && user.status !== 'active') {
        throw new AppError('Invalid refresh token', 401);
      }

      return this.generateTokens(
        user.id,
        user.tenantId,
        user.email,
        user.role,
      );
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     GET ME
     ═══════════════════════════════════════════════════════════ */

  static async getMe(userId: string): Promise<any> {
    const user = await User.findById(userId).select('-passwordHash').lean();
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isPlatformAdmin = isPlatformAdminEmail(user.email);

    return {
      ...user,
      _id: user._id.toString(),
      id: user._id.toString(),
      isPlatformAdmin,
    };
  }

  /* ═══════════════════════════════════════════════════════════
     TOKEN GENERATION
     ═══════════════════════════════════════════════════════════ */

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

  /* ═══════════════════════════════════════════════════════════
     PASSWORD RESET
     ═══════════════════════════════════════════════════════════ */

  static async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email, status: 'active' });
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');

    await PasswordResetToken.deleteMany({ userId: user.id });

    await PasswordResetToken.create({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      used: false,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await sendPasswordResetEmail(
      email,
      resetLink,
      `${user.firstName} ${user.lastName}`.trim(),
    );

    console.log(`🔑 Password reset requested for ${email}`);
  }

  static async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<void> {
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