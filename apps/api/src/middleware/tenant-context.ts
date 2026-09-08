import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export interface TenantRequest extends Request {
  tenantId: string;
  userId?: string;
  userRole?: string;
}

export function tenantContext(req: Request, res: Response, next: NextFunction) {
  // Get tenant from headers, query params, or JWT
  let tenantId = req.headers['x-tenant-id'] as string || 
                  req.query.tenantId as string ||
                  req.cookies?.tenantId;

  // Fallback to default tenant for development
  if (!tenantId && process.env.NODE_ENV === 'development') {
    tenantId = config.tenant.defaultId;
  }

  // In production, enforce tenant from JWT
  if (process.env.NODE_ENV === 'production' && !tenantId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Tenant ID is required' 
    });
  }

  // Attach tenant to request
  (req as TenantRequest).tenantId = tenantId || config.tenant.defaultId;
  next();
}