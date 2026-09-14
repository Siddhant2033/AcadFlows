import { Request, Response, NextFunction } from 'express';
import { PlatformService } from './service';
import { AuthRequest } from '../../middleware/auth';
import { z } from 'zod';

/* ─────────────────────────────────────────────────────────────
   Validation schemas
   ───────────────────────────────────────────────────────────── */

const rejectSchoolSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

const suspendSchoolSchema = z.object({
  reason: z.string().min(1, 'Suspension reason is required').max(500),
});

const rejectUserSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

const suspendUserSchema = z.object({
  reason: z.string().min(1, 'Suspension reason is required').max(500),
});

const listSchoolsSchema = z.object({
  status: z.enum(['pending', 'active', 'suspended', 'rejected', 'all']).optional().default('all'),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

const listUsersSchema = z.object({
  tenantId: z.string().optional(),
  role: z.enum(['admin', 'teacher', 'student', 'guardian']).optional(),
  status: z.enum(['pending', 'active', 'suspended', 'rejected', 'all']).optional().default('all'),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
});

/* ─────────────────────────────────────────────────────────────
   Controller
   ───────────────────────────────────────────────────────────── */

export class PlatformController {
  /* ═══════════════ DASHBOARD ═══════════════ */

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await PlatformService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getRecentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const activity = await PlatformService.getRecentActivity();
      res.json({ success: true, data: activity });
    } catch (error) {
      next(error);
    }
  }

  static async getPendingCounts(req: Request, res: Response, next: NextFunction) {
    try {
      const counts = await PlatformService.getPendingCounts();
      res.json({ success: true, data: counts });
    } catch (error) {
      next(error);
    }
  }

  /* ═══════════════ SCHOOLS ═══════════════ */

  static async listSchools(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = listSchoolsSchema.parse(req.query);
      const result = await PlatformService.listSchools(validated);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async listPendingSchools(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PlatformService.listSchools({
        status: 'pending',
        page: 1,
        limit: 100,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getSchoolById(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = req.params;
      const school = await PlatformService.getSchoolById(tenantId);
      res.json({ success: true, data: school });
    } catch (error) {
      next(error);
    }
  }

  static async approveSchool(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { tenantId } = req.params;

      const school = await PlatformService.approveSchool(
        tenantId,
        authReq.user.email,
      );

      res.json({
        success: true,
        data: school,
        message: `School "${school.name}" approved. School code: ${school.formattedSchoolCode}`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectSchool(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { tenantId } = req.params;
      const validated = rejectSchoolSchema.parse(req.body);

      const school = await PlatformService.rejectSchool(
        tenantId,
        authReq.user.email,
        validated.reason,
      );

      res.json({
        success: true,
        data: school,
        message: 'School registration rejected',
      });
    } catch (error) {
      next(error);
    }
  }

  static async suspendSchool(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { tenantId } = req.params;
      const validated = suspendSchoolSchema.parse(req.body);

      const school = await PlatformService.suspendSchool(
        tenantId,
        authReq.user.email,
        validated.reason,
      );

      res.json({
        success: true,
        data: school,
        message: 'School suspended',
      });
    } catch (error) {
      next(error);
    }
  }

  static async reactivateSchool(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { tenantId } = req.params;

      const school = await PlatformService.reactivateSchool(
        tenantId,
        authReq.user.email,
      );

      res.json({
        success: true,
        data: school,
        message: 'School reactivated',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSchool(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = req.params;
      await PlatformService.deleteSchool(tenantId);
      res.json({ success: true, message: 'School deleted' });
    } catch (error) {
      next(error);
    }
  }

  /* ═══════════════ USERS ═══════════════ */

  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = listUsersSchema.parse(req.query);
      const result = await PlatformService.listUsers(validated);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const user = await PlatformService.getUserById(userId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  static async approveUser(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { userId } = req.params;

      const user = await PlatformService.approveUser(
        userId,
        authReq.user.email,
      );

      res.json({ success: true, data: user, message: 'User approved' });
    } catch (error) {
      next(error);
    }
  }

  static async rejectUser(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { userId } = req.params;
      const validated = rejectUserSchema.parse(req.body);

      const user = await PlatformService.rejectUser(
        userId,
        authReq.user.email,
        validated.reason,
      );

      res.json({ success: true, data: user, message: 'User rejected' });
    } catch (error) {
      next(error);
    }
  }

  static async suspendUser(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { userId } = req.params;
      const validated = suspendUserSchema.parse(req.body);

      const user = await PlatformService.suspendUser(
        userId,
        authReq.user.email,
        validated.reason,
      );

      res.json({ success: true, data: user, message: 'User suspended' });
    } catch (error) {
      next(error);
    }
  }

  static async reactivateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { userId } = req.params;

      const user = await PlatformService.reactivateUser(
        userId,
        authReq.user.email,
      );

      res.json({ success: true, data: user, message: 'User reactivated' });
    } catch (error) {
      next(error);
    }
  }
}