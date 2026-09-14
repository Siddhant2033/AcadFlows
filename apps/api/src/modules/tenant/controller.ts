import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { TenantService } from './service';
import { AppError } from '../../middleware/error-handler';
import { formatSchoolCode } from '../../utils/school-code';
import { config } from '../../config';
import { z } from 'zod';
import {
  sendSchoolPendingApprovalEmail,
} from '../../services/email.service';

/* ─────────────────────────────────────────────────────────────
   Validation schemas
   ───────────────────────────────────────────────────────────── */

const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logoUrl: z.string().url().optional(),
  settings: z
    .object({
      domain: z.string().optional(),
      academicYearStart: z.string().optional(),
      academicYearEnd: z.string().optional(),
      timezone: z.string().optional(),
      currency: z.string().optional(),
      language: z.string().optional(),
      emailDomain: z.string().optional(),
    })
    .optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logoUrl: z.string().url().optional(),
  status: z
    .enum(['pending', 'active', 'suspended', 'rejected', 'inactive', 'archived'])
    .optional(),
  settings: z
    .object({
      domain: z.string().optional(),
      academicYearStart: z.string().optional(),
      academicYearEnd: z.string().optional(),
      timezone: z.string().optional(),
      currency: z.string().optional(),
      language: z.string().optional(),
      emailDomain: z.string().optional(),
    })
    .optional(),
});

const listTenantsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
  status: z
    .enum(['pending', 'active', 'suspended', 'rejected', 'inactive', 'archived'])
    .optional(),
  search: z.string().optional(),
});

const validateSchoolCodeSchema = z.object({
  schoolCode: z.string().min(1, 'School code is required'),
});

const createSchoolSchema = z.object({
  name: z.string().min(1, 'School name is required'),
  slug: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

/* ─────────────────────────────────────────────────────────────
   Controller
   ───────────────────────────────────────────────────────────── */

export class TenantController {
  /* ═══════════════════════════════════════════════════════════
     SCHOOL CREATION — PUBLIC, RATE-LIMITED
     Creates a `pending` tenant and notifies the platform admin.
     ═══════════════════════════════════════════════════════════ */

  static async createSchool(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('📝 Creating school with data:', req.body);

      const validated = createSchoolSchema.parse(req.body);

      const tenant = await TenantService.createSchool({
        ...validated,
        registrationIp: req.ip || req.socket.remoteAddress || '',
        registrationUserAgent: req.get('user-agent') || '',
      });

      console.log('✅ School created (pending):', {
        id: tenant.id,
        name: tenant.name,
        schoolCode: tenant.schoolCode,
      });

      // ── Notify the platform admin (founder) ──
      if (config.platformAdmin.email) {
        const reviewLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/platform-admin/schools/pending`;
        try {
          await sendSchoolPendingApprovalEmail(
            config.platformAdmin.email,
            tenant.name,
            tenant.email || 'N/A',
            tenant.phone || 'N/A',
            reviewLink,
          );
          console.log(
            `📧 School pending notification sent to platform admin: ${config.platformAdmin.email}`,
          );
        } catch (emailErr) {
          // Don't fail the request if the email fails
          console.error('Failed to notify platform admin:', emailErr);
        }
      } else {
        console.warn(
          '⚠️  PLATFORM_ADMIN_EMAIL not set — platform admin will not be notified',
        );
      }

      res.status(201).json({
        success: true,
        data: tenant,
        message:
          'School registered successfully! Your registration is pending approval. You will receive an email once it is reviewed.',
      });
    } catch (error) {
      console.error('❌ School creation error:', error);
      next(error);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     VERIFICATION + VALIDATION
     ═══════════════════════════════════════════════════════════ */

  /**
   * Public — verify a school's email using the token sent at registration.
   */
  static async verifySchoolEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      if (!token) {
        throw new AppError('Verification token is required', 400);
      }

      const result = await TenantService.verifySchoolEmail(token);

      res.json({
        success: true,
        data: result,
        message:
          'Email verified! Your school is now pending manual approval. You will receive another email once approved.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async validateSchoolCode(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('🔍 Validating school code:', req.body);

      const validated = validateSchoolCodeSchema.parse(req.body);
      const result = await TenantService.validateSchoolCode(
        validated.schoolCode,
      );

      console.log('📊 Validation result:', result);

      if (!result.valid) {
        return res.status(404).json({
          success: false,
          error: 'Invalid school code. Please check and try again.',
          data: null,
        });
      }

      res.json({
        success: true,
        data: result.tenant,
        message: `School found: ${result.tenant.name}`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request: ' + error.errors[0].message,
        });
      }
      console.error('❌ School code validation error:', error);
      next(error);
    }
  }

  static async validateTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = req.params;
      const isValid = await TenantService.validateTenant(tenantId);
      res.json({
        success: true,
        data: { isValid },
      });
    } catch (error) {
      next(error);
    }
  }

  static async hasAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = req.params;
      const hasAdmin = await TenantService.hasAdmin(tenantId);
      res.json({
        success: true,
        data: { hasAdmin },
      });
    } catch (error) {
      next(error);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     PUBLIC TENANT LOOKUPS
     ═══════════════════════════════════════════════════════════ */

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const tenant = await TenantService.getBySlug(req.params.slug);
      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBySchoolCode(req: Request, res: Response, next: NextFunction) {
    try {
      const tenant = await TenantService.getBySchoolCode(
        req.params.schoolCode,
      );
      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPublicInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const tenant = await TenantService.getPublicInfo(req.params.slug);
      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPublicInfoBySchoolCode(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { schoolCode } = req.params;
      const tenant = await TenantService.getPublicInfoBySchoolCode(schoolCode);
      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPublicCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('🔍 Getting public current tenant');

      let tenantId =
        req.cookies?.tenantId || (req.headers['x-tenant-id'] as string);

      if (!tenantId) {
        tenantId = req.query.tenantId as string;
      }

      // Dev fallback: subdomain detection
      if (!tenantId && process.env.NODE_ENV === 'development') {
        const host = req.get('host') || '';
        const subdomain = host.split('.')[0];
        if (
          subdomain &&
          subdomain !== 'localhost' &&
          subdomain !== 'www' &&
          subdomain !== 'app'
        ) {
          try {
            const tenant = await TenantService.getBySlug(subdomain);
            if (tenant) {
              return res.json({
                success: true,
                data: tenant,
              });
            }
          } catch {
            /* ignore */
          }
        }
      }

      // Dev fallback: any active tenant
      if (!tenantId && process.env.NODE_ENV === 'development') {
        try {
          const Tenant = mongoose.model('Tenant');
          const anyTenant = await Tenant.findOne({ status: 'active' });
          if (anyTenant) {
            tenantId = anyTenant._id.toString();
          }
        } catch {
          /* ignore */
        }
      }

      if (!tenantId) {
        return res.status(404).json({
          success: false,
          error: 'No tenant context found',
          data: null,
        });
      }

      let tenant;
      try {
        if (mongoose.Types.ObjectId.isValid(tenantId)) {
          tenant = await TenantService.getById(tenantId);
        } else {
          tenant = await TenantService.getBySlug(tenantId);
        }
      } catch {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found',
          data: null,
        });
      }

      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found',
          data: null,
        });
      }

      const tenantObj = {
        ...tenant,
        id: tenant._id || tenant.id,
        _id: tenant._id || tenant.id,
        formattedSchoolCode:
          tenant.formattedSchoolCode || formatSchoolCode(tenant.schoolCode),
      };

      console.log('✅ Public tenant found:', tenantObj.name);

      res.json({
        success: true,
        data: tenantObj,
      });
    } catch (error) {
      console.error('❌ Error getting public tenant:', error);
      res.status(404).json({
        success: false,
        error: 'Tenant not found',
        data: null,
      });
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenant = await TenantService.getById(req.params.id);
      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as Request & { tenantId?: string }).tenantId;

      if (!tenantId) {
        throw new AppError('No tenant context found', 404);
      }

      const tenant = await TenantService.getById(tenantId);

      res.json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     ADMIN-ONLY CRUD
     ═══════════════════════════════════════════════════════════ */

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createTenantSchema.parse(req.body);
      const tenant = await TenantService.create(validated);
      res.status(201).json({
        success: true,
        data: tenant,
        message:
          'School created successfully! Your school code is: ' +
          tenant.formattedSchoolCode,
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateTenantSchema.parse(req.body);
      const tenant = await TenantService.update(req.params.id, validated);
      res.json({
        success: true,
        data: tenant,
        message: 'School updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = listTenantsSchema.parse(req.query);
      const result = await TenantService.list(validated);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}