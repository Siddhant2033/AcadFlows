import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './service';
import { AuthRequest } from '../../middleware/auth';

export class DashboardController {
  static async getDashboardData(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user.id;
      const tenantId = authReq.user.tenantId;
      const role = authReq.user.role;

      console.log('📊 Dashboard data requested for:', { userId, tenantId, role });

      const data = await DashboardService.getDashboardData(userId, tenantId, role);

      res.json({
        success: true,
        data,
        message: 'Dashboard data fetched successfully',
      });
    } catch (error) {
      console.error('❌ Dashboard data error:', error);

      // Fallback: return a minimal dashboard so the UI can render
      // even when the tenant has no data yet.
      const authReq = req as AuthRequest;
      try {
        const fallback = await DashboardService.getStats(
          authReq.user.tenantId,
          authReq.user.role,
        );
        return res.json({
          success: true,
          data: {
            user: {
              id: authReq.user.id,
              firstName: '',
              lastName: '',
              email: authReq.user.email,
              role: authReq.user.role,
            },
            tenant: {
              id: authReq.user.tenantId,
              name: '',
              schoolCode: '',
              formattedSchoolCode: '',
            },
            stats: fallback,
            recentActivity: [],
          },
          message: 'Dashboard loaded with limited data',
        });
      } catch {
        // If even the fallback fails, pass to the error handler
        next(error);
      }
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const tenantId = authReq.user.tenantId;
      const role = authReq.user.role;

      const stats = await DashboardService.getStats(tenantId, role);

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getRecentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const tenantId = authReq.user.tenantId;
      const userId = authReq.user.id;
      const role = authReq.user.role;

      const activities = await DashboardService.getRecentActivity(tenantId, userId, role);

      res.json({ success: true, data: activities });
    } catch (error) {
      next(error);
    }
  }

  static async getStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const students = await DashboardService.getStudents(authReq.user.tenantId);
      res.json({ success: true, data: students });
    } catch (error) {
      next(error);
    }
  }

  static async getTeachers(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const teachers = await DashboardService.getTeachers(authReq.user.tenantId);
      res.json({ success: true, data: teachers });
    } catch (error) {
      next(error);
    }
  }

  static async getClasses(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const classes = await DashboardService.getClasses(authReq.user.tenantId);
      res.json({ success: true, data: classes });
    } catch (error) {
      next(error);
    }
  }
}