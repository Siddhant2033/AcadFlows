import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './service';
import { AuthRequest } from '../../middleware/auth';

export class DashboardController {
  static async getDashboardData(req: Request, res: Response, next: NextFunction) {
    const authReq = req as AuthRequest;

    try {
      const { id: userId, tenantId, role } = authReq.user;
      console.log('📊 Dashboard data requested for:', { userId, tenantId, role });

      const data = await DashboardService.getDashboardData(userId, tenantId, role);

      res.json({
        success: true,
        data,
        message: 'Dashboard data fetched successfully',
      });
    } catch (error) {
      // If the service throws, return a minimal valid response so the UI
      // renders instead of showing an error screen.
      console.error('❌ Dashboard data error:', error);

      let stats = {
        totalStudents: 0,
        totalTeachers: 0,
        attendance: '0%',
        feeCollection: '0%',
        revenue: 0,
        pendingInvoices: 0,
      };

      try {
        stats = await DashboardService.getStats(authReq.user.tenantId, authReq.user.role);
      } catch {
        /* keep zeros */
      }

      res.json({
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
          stats,
          recentActivity: [],
        },
        message: 'Dashboard loaded with limited data',
      });
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const stats = await DashboardService.getStats(
        authReq.user.tenantId,
        authReq.user.role,
      );
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('❌ Stats error:', error);
      // Return zeros rather than 500
      res.json({
        success: true,
        data: {
          totalStudents: 0,
          totalTeachers: 0,
          attendance: '0%',
          feeCollection: '0%',
          revenue: 0,
          pendingInvoices: 0,
        },
      });
    }
  }

  static async getRecentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const activities = await DashboardService.getRecentActivity(
        authReq.user.tenantId,
        authReq.user.id,
        authReq.user.role,
      );
      res.json({ success: true, data: activities });
    } catch (error) {
      console.error('❌ Activity error:', error);
      res.json({ success: true, data: [] });
    }
  }

  static async getStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const students = await DashboardService.getStudents(authReq.user.tenantId);
      res.json({ success: true, data: students });
    } catch {
      res.json({ success: true, data: [] });
    }
  }

  static async getTeachers(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const teachers = await DashboardService.getTeachers(authReq.user.tenantId);
      res.json({ success: true, data: teachers });
    } catch {
      res.json({ success: true, data: [] });
    }
  }

  static async getClasses(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const classes = await DashboardService.getClasses(authReq.user.tenantId);
      res.json({ success: true, data: classes });
    } catch {
      res.json({ success: true, data: [] });
    }
  }
}