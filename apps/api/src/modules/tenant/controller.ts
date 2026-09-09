import { Request, Response, NextFunction } from 'express';
import { TenantService } from './service';
import { AppError } from '../../middleware/error-handler';
import { z } from 'zod';

const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logoUrl: z.string().url().optional(),
  settings: z.object({
    domain: z.string().optional(),
    academicYearStart: z.string().optional(),
    academicYearEnd: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
    language: z.string().optional(),
    emailDomain: z.string().optional(),
  }).optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logoUrl: z.string().url().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  settings: z.object({
    domain: z.string().optional(),
    academicYearStart: z.string().optional(),
    academicYearEnd: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
    language: z.string().optional(),
    emailDomain: z.string().optional(),
  }).optional(),
});

const listTenantsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  search: z.string().optional(),
});

const validateSchoolCodeSchema = z.object({
  schoolCode: z.string().min(1, 'School code is required'),
});

const createSchoolSchema = z.object({
  name: z.string().min(1, 'School name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export class TenantController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createTenantSchema.parse(req.body);
      const tenant = await TenantService.create(validated);
      res.status(201).json({
        success: true,
        data: tenant,
        message: 'School created successfully! Your school code is: ' + tenant.formattedSchoolCode,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createSchool(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('📝 Creating school with data:', req.body);
      
      const validated = createSchoolSchema.parse(req.body);
      const tenant = await TenantService.createSchool(validated);
      
      console.log('✅ School created:', {
        id: tenant.id,
        name: tenant.name,
        schoolCode: tenant.schoolCode,
      });
      
      res.status(201).json({
        success: true,
        data: tenant,
        message: 'School created successfully! Your school code is: ' + tenant.formattedSchoolCode,
      });
    } catch (error) {
      console.error('❌ School creation error:', error);
      next(error);
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
      const tenant = await TenantService.getBySchoolCode(req.params.schoolCode);
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

  static async getPublicInfoBySchoolCode(req: Request, res: Response, next: NextFunction) {
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

  static async validateSchoolCode(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('🔍 Validating school code:', req.body);
      
      const validated = validateSchoolCodeSchema.parse(req.body);
      const result = await TenantService.validateSchoolCode(validated.schoolCode);
      
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

  static async getCurrentTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as Request & { tenantId?: string }).tenantId;
      
      if (!tenantId) {
        throw new AppError('No tenant context found', 404);
      }
      
      const tenantObj = await TenantService.getById(tenantId);
      
      res.json({
        success: true,
        data: tenantObj,
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
}