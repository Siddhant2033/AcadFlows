import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../../models/AuditLog';
import { AuthRequest } from '../../middleware/auth';

export class AuditLogController {
  /**
   * GET /documents/audit-log
   * Query: userId, resource, action, startDate, endDate, page, limit
   */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const {
        userId,
        resource,
        action,
        startDate,
        endDate,
        search,
        page = '1',
        limit = '50',
      } = req.query;

      const query: any = { tenantId: authReq.user.tenantId };

      if (userId) query.userId = userId;
      if (resource) query.resource = resource;
      if (action) query.action = action;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate as string);
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }

      if (search) {
        query.$or = [
          { description: { $regex: search, $options: 'i' } },
          { userEmail: { $regex: search, $options: 'i' } },
          { resourceId: { $regex: search, $options: 'i' } },
        ];
      }

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
      const skip = (pageNum - 1) * limitNum;

      const [items, total] = await Promise.all([
        AuditLog.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        AuditLog.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: {
          items: items.map(item => ({
            _id: item._id.toString(),
            userId: item.userId,
            userEmail: item.userEmail,
            userRole: item.userRole,
            action: item.action,
            resource: item.resource,
            resourceId: item.resourceId,
            description: item.description,
            method: item.method,
            path: item.path,
            statusCode: item.statusCode,
            ip: item.ip,
            createdAt: item.createdAt,
          })),
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /documents/audit-log/filters
   * Returns distinct users and resources for filter dropdowns.
   */
  static async filters(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;

      const [users, resources, actions] = await Promise.all([
        AuditLog.distinct('userEmail', { tenantId: authReq.user.tenantId }),
        AuditLog.distinct('resource', { tenantId: authReq.user.tenantId }),
        AuditLog.distinct('action', { tenantId: authReq.user.tenantId }),
      ]);

      res.json({
        success: true,
        data: {
          users: users.filter(Boolean).sort(),
          resources: resources.filter(Boolean).sort(),
          actions: actions.filter(Boolean).sort(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}