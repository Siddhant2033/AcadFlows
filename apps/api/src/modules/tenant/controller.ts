import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { TenantService } from './service';
import { AppError } from '../../middleware/error-handler';
import { z } from 'zod';

const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  settings: z.record(z.any()).optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  settings: z.record(z.any()).optional(),
});

const listTenantsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
});

export class TenantController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createTenantSchema.parse(req.body);
      const tenant = await TenantService.create(validated);
      res.status(201).json({
        success: true,
        data: tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate ObjectId
      const id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid tenant ID format', 400);
      }
      
      const tenant = await TenantService.getById(id);
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

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate ObjectId
      const id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid tenant ID format', 400);
      }
      
      const validated = updateTenantSchema.parse(req.body);
      const tenant = await TenantService.update(id, validated);
      res.json({
        success: true,
        data: tenant,
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