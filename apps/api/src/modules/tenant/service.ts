import mongoose from 'mongoose';
import crypto from 'crypto';
import { Tenant } from '../../models/Tenant';
import { AppError } from '../../middleware/error-handler';
import { Tenant as TenantType } from '@acadflows/shared';
import {
  generateUniqueSchoolCode,
  validateSchoolCode,
  formatSchoolCode,
  normalizeSchoolCode,
} from '../../utils/school-code';
import { sendSchoolVerificationEmail } from '../../services/email.service';

export class TenantService {
  /* ═══════════════════════════════════════════════════════════
     CREATE — admin-created tenant (not public registration)
     ═══════════════════════════════════════════════════════════ */

  static async create(data: Partial<TenantType>): Promise<any> {
    if (!data.name || !data.slug) {
      throw new AppError('Name and slug are required', 400);
    }

    const existingSlug = await Tenant.findOne({ slug: data.slug });
    if (existingSlug) {
      throw new AppError('Tenant with this slug already exists', 409);
    }

    const schoolCode = await generateUniqueSchoolCode();

    const tenant = await Tenant.create({
      ...data,
      schoolCode,
      status: 'active',
      emailVerified: true,
      codeGeneratedAt: new Date(),
    });

    const tenantObj: any = tenant.toObject();
    tenantObj.formattedSchoolCode = formatSchoolCode(schoolCode);
    tenantObj.id = tenant._id;

    return tenantObj;
  }

  /* ═══════════════════════════════════════════════════════════
     CREATE SCHOOL — public registration (creates pending tenant)
     ═══════════════════════════════════════════════════════════ */

  static async createSchool(data: {
    name: string;
    slug?: string;
    address?: string;
    phone?: string;
    email?: string;
    registrationIp?: string;
    registrationUserAgent?: string;
  }): Promise<any> {
    if (!data.name) {
      throw new AppError('School name is required', 400);
    }

    // Generate slug from name if not provided
    let slug = data.slug;
    if (!slug) {
      slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Ensure slug is unique
    const existingSlug = await Tenant.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    // Generate unique school code
    const schoolCode = await generateUniqueSchoolCode();

    // Generate email verification token (48h expiry)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(
      Date.now() + 48 * 60 * 60 * 1000,
    );

    const tenant = await Tenant.create({
      name: data.name,
      slug,
      schoolCode,
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      // New schools start PENDING — platform admin must approve
      status: 'pending',
      emailVerified: false,
      verificationToken,
      verificationTokenExpiresAt,
      registrationIp: data.registrationIp,
      registrationUserAgent: data.registrationUserAgent,
    });

    const tenantObj: any = tenant.toObject();
    tenantObj.formattedSchoolCode = formatSchoolCode(schoolCode);
    tenantObj.id = tenant._id;

    // Send verification email if we have one
    if (data.email) {
      const frontendUrl =
        process.env.FRONTEND_URL || 'http://localhost:5173';
      const verifyLink = `${frontendUrl}/verify-school?token=${verificationToken}`;

      try {
        await sendSchoolVerificationEmail(
          data.email,
          verifyLink,
          data.name,
          'Admin',
        );
        console.log(`📧 School verification email sent to ${data.email}`);
      } catch (err) {
        console.error('Failed to send school verification email:', err);
      }
    }

    console.log('🏫 School created (pending):', {
      id: tenant._id,
      name: tenant.name,
      schoolCode: tenant.schoolCode,
    });

    return tenantObj;
  }

  /* ═══════════════════════════════════════════════════════════
     VERIFY EMAIL
     ═══════════════════════════════════════════════════════════ */

  static async verifySchoolEmail(
    token: string,
  ): Promise<{ emailVerified: boolean }> {
    if (!token) {
      throw new AppError('Verification token is required', 400);
    }

    const tenant = await Tenant.findOne({
      verificationToken: token,
      emailVerified: false,
    });

    if (!tenant) {
      throw new AppError(
        'Invalid or already-used verification token',
        400,
      );
    }

    if (
      tenant.verificationTokenExpiresAt &&
      tenant.verificationTokenExpiresAt < new Date()
    ) {
      throw new AppError('Verification token has expired', 400);
    }

    tenant.emailVerified = true;
    tenant.verificationToken = undefined;
    tenant.verificationTokenExpiresAt = undefined;
    await tenant.save();

    console.log(`✅ Email verified for tenant ${tenant.name}`);

    return { emailVerified: true };
  }

  /* ═══════════════════════════════════════════════════════════
     GETTERS
     ═══════════════════════════════════════════════════════════ */

  static async getBySchoolCode(schoolCode: string): Promise<any> {
    const normalizedCode = normalizeSchoolCode(schoolCode);

    if (!validateSchoolCode(normalizedCode)) {
      throw new AppError('Invalid school code format', 400);
    }

    const tenant = await Tenant.findOne({
      schoolCode: normalizedCode,
      status: 'active',
    });

    if (!tenant) {
      throw new AppError('School not found with this code', 404);
    }

    const tenantObj: any = tenant.toObject();
    tenantObj.formattedSchoolCode = formatSchoolCode(normalizedCode);
    tenantObj.id = tenant._id;

    return tenantObj;
  }

  static async getById(id: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid tenant ID format', 400);
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    const tenantObj: any = tenant.toObject();
    tenantObj.formattedSchoolCode = formatSchoolCode(tenant.schoolCode);
    tenantObj.id = tenant._id;

    return tenantObj;
  }

  static async getBySlug(slug: string): Promise<any> {
    const tenant = await Tenant.findOne({ slug, status: 'active' });
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    const tenantObj: any = tenant.toObject();
    tenantObj.formattedSchoolCode = formatSchoolCode(tenant.schoolCode);
    tenantObj.id = tenant._id;

    return tenantObj;
  }

  /* ═══════════════════════════════════════════════════════════
     UPDATE
     ═══════════════════════════════════════════════════════════ */

  static async update(
    id: string,
    data: Partial<TenantType>,
  ): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid tenant ID format', 400);
    }

    if (data.slug) {
      const existing = await Tenant.findOne({
        slug: data.slug,
        _id: { $ne: id },
      });
      if (existing) {
        throw new AppError('Tenant with this slug already exists', 409);
      }
    }

    const tenant = await Tenant.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    const tenantObj: any = tenant.toObject();
    tenantObj.formattedSchoolCode = formatSchoolCode(tenant.schoolCode);
    tenantObj.id = tenant._id;

    return tenantObj;
  }

  /* ═══════════════════════════════════════════════════════════
     LIST
     ═══════════════════════════════════════════════════════════ */

  static async list(options: {
    limit?: number;
    offset?: number;
    status?: string;
    search?: string;
  }) {
    const filter: any = {};
    if (options.status) {
      filter.status = options.status;
    }
    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { slug: { $regex: options.search, $options: 'i' } },
        { schoolCode: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      Tenant.find(filter)
        .limit(options.limit || 20)
        .skip(options.offset || 0)
        .sort({ createdAt: -1 }),
      Tenant.countDocuments(filter),
    ]);

    return {
      items: tenants.map(t => {
        const obj: any = t.toObject();
        obj.formattedSchoolCode = formatSchoolCode(t.schoolCode);
        obj.id = t._id;
        return obj;
      }),
      total,
      limit: options.limit || 20,
      offset: options.offset || 0,
    };
  }

  /* ═══════════════════════════════════════════════════════════
     PUBLIC INFO
     ═══════════════════════════════════════════════════════════ */

  static async getPublicInfo(slug: string): Promise<any> {
    const tenant = await Tenant.findOne({ slug, status: 'active' });
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    return {
      id: tenant._id,
      _id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      schoolCode: tenant.schoolCode,
      formattedSchoolCode: formatSchoolCode(tenant.schoolCode),
      logoUrl: tenant.logoUrl,
      settings: {
        currency: tenant.settings?.currency,
        timezone: tenant.settings?.timezone,
        language: tenant.settings?.language,
      },
    };
  }

  static async getPublicInfoBySchoolCode(
    schoolCode: string,
  ): Promise<any> {
    const normalizedCode = normalizeSchoolCode(schoolCode);

    if (!validateSchoolCode(normalizedCode)) {
      throw new AppError('Invalid school code format', 400);
    }

    const tenant = await Tenant.findOne({
      schoolCode: normalizedCode,
      status: 'active',
    });

    if (!tenant) {
      throw new AppError('School not found with this code', 404);
    }

    return {
      id: tenant._id,
      _id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      schoolCode: tenant.schoolCode,
      formattedSchoolCode: formatSchoolCode(tenant.schoolCode),
      logoUrl: tenant.logoUrl,
      settings: {
        currency: tenant.settings?.currency,
        timezone: tenant.settings?.timezone,
        language: tenant.settings?.language,
      },
    };
  }

  /* ═══════════════════════════════════════════════════════════
     VALIDATION HELPERS
     ═══════════════════════════════════════════════════════════ */

  static async validateTenant(tenantId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return false;
    }
    const tenant = await Tenant.findOne({
      _id: tenantId,
      status: 'active',
    });
    return !!tenant;
  }

  static async validateSchoolCode(
    schoolCode: string,
  ): Promise<{ valid: boolean; tenant?: any }> {
    try {
      const normalizedCode = normalizeSchoolCode(schoolCode);

      if (!validateSchoolCode(normalizedCode)) {
        return { valid: false };
      }

      const tenant = await Tenant.findOne({
        schoolCode: normalizedCode,
        status: 'active',
      });

      if (!tenant) {
        return { valid: false };
      }

      return {
        valid: true,
        tenant: {
          id: tenant._id,
          _id: tenant._id,
          name: tenant.name,
          schoolCode: tenant.schoolCode,
          formattedSchoolCode: formatSchoolCode(tenant.schoolCode),
        },
      };
    } catch (error) {
      console.error('Error validating school code:', error);
      return { valid: false };
    }
  }

  static async hasAdmin(tenantId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return false;
    }

    const User = mongoose.model('User');
    const admin = await User.findOne({
      tenantId,
      role: 'admin',
      status: 'active',
    });

    return !!admin;
  }
}