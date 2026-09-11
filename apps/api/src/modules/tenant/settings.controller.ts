import { Request, Response, NextFunction } from 'express';
import { Tenant } from '../../models/Tenant';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/error-handler';
import { z } from 'zod';

const gradingBandSchema = z.object({
  grade: z.string().min(1).max(5),
  minPercent: z.number().min(0).max(100),
  maxPercent: z.number().min(0).max(100),
  points: z.number().min(0).max(20),
  description: z.string().optional(),
});

const settingsSchema = z.object({
  // Branding
  logoUrl: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be hex color like #DF301C').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  motto: z.string().max(200).optional(),
  affiliation: z.string().max(100).optional(),
  affiliationNumber: z.string().max(50).optional(),

  // Academic
  academicYearStart: z.string().optional(),
  academicYearEnd: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  language: z.string().optional(),
  emailDomain: z.string().optional(),

  // Grading
  gradingScale: z.array(gradingBandSchema).optional(),
  passingPercent: z.number().min(0).max(100).optional(),

  // Fees
  feeDefaults: z
    .object({
      lateFeePercent: z.number().min(0).max(100).optional(),
      gracePeriodDays: z.number().min(0).optional(),
      currency: z.string().optional(),
    })
    .optional(),

  // Notifications
  notifications: z
    .object({
      attendanceAlertsEnabled: z.boolean().optional(),
      feeRemindersEnabled: z.boolean().optional(),
      lowAttendanceThreshold: z.number().min(0).max(100).optional(),
    })
    .optional(),
});

export class TenantSettingsController {
  /**
   * GET /tenants/settings
   */
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;

      const tenant = await Tenant.findById(authReq.user.tenantId).lean();
      if (!tenant) {
        throw new AppError('Tenant not found', 404);
      }

      res.json({
        success: true,
        data: {
          name: tenant.name,
          slug: tenant.slug,
          schoolCode: tenant.schoolCode,
          address: tenant.address || '',
          phone: tenant.phone || '',
          email: tenant.email || '',
          settings: tenant.settings || {},
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /tenants/settings
   */
  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = settingsSchema.parse(req.body);

      // Build a $set payload with dot notation for the settings sub-document.
      const update: Record<string, any> = {};
      for (const [key, value] of Object.entries(validated)) {
        if (value !== undefined) {
          update[`settings.${key}`] = value;
        }
      }

      if (Object.keys(update).length === 0) {
        throw new AppError('No valid settings to update', 400);
      }

      const tenant = await Tenant.findByIdAndUpdate(
        authReq.user.tenantId,
        { $set: update },
        { new: true, runValidators: true },
      ).lean();

      if (!tenant) {
        throw new AppError('Tenant not found', 404);
      }

      res.json({
        success: true,
        data: { settings: tenant.settings || {} },
        message: 'Settings updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /tenants/school-info
   * Update the school name/address/phone/email (top-level fields).
   */
  static async updateSchoolInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;

      const schema = z.object({
        name: z.string().min(1).max(200).optional(),
        address: z.string().max(500).optional(),
        phone: z.string().max(20).optional(),
        email: z.string().email().max(100).optional(),
      });

      const validated = schema.parse(req.body);

      const tenant = await Tenant.findByIdAndUpdate(
        authReq.user.tenantId,
        { $set: validated },
        { new: true, runValidators: true },
      ).lean();

      if (!tenant) {
        throw new AppError('Tenant not found', 404);
      }

      res.json({
        success: true,
        data: {
          name: tenant.name,
          address: tenant.address || '',
          phone: tenant.phone || '',
          email: tenant.email || '',
        },
        message: 'School info updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /tenants/logo
   * Accepts a multipart file upload, stores as base64 in the tenant doc.
   */
  static async uploadLogo(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const file = (req as Request & { file?: Express.Multer.File }).file;

      if (!file) {
        throw new AppError('No file uploaded', 400);
      }

      if (!file.mimetype.startsWith('image/')) {
        throw new AppError('Only image files are allowed', 400);
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new AppError('Logo must be under 2 MB', 400);
      }

      const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      const tenant = await Tenant.findByIdAndUpdate(
        authReq.user.tenantId,
        { $set: { 'settings.logoUrl': dataUrl, logoUrl: dataUrl } },
        { new: true },
      ).lean();

      if (!tenant) {
        throw new AppError('Tenant not found', 404);
      }

      res.json({
        success: true,
        data: { logoUrl: dataUrl },
        message: 'Logo uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /tenants/logo
   */
  static async removeLogo(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;

      const tenant = await Tenant.findByIdAndUpdate(
        authReq.user.tenantId,
        { $set: { 'settings.logoUrl': '', logoUrl: '' } },
        { new: true },
      ).lean();

      if (!tenant) {
        throw new AppError('Tenant not found', 404);
      }

      res.json({ success: true, message: 'Logo removed successfully' });
    } catch (error) {
      next(error);
    }
  }
}