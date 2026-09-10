import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { TenantRequest } from './tenant-context';

export interface AuthRequest extends Request {
  user: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;

    (req as AuthRequest).user = {
      id: decoded.userId,
      tenantId: decoded.tenantId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    if (!roles.includes(authReq.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    next();
  };
}

/**
 * FIXED B9: Ensure the tenant resolved from the request (subdomain, header,
 * cookie, query) matches the tenantId baked into the JWT. Prevents a user
 * logged into School A from accessing School B's data by sending a
 * different X-Tenant-Id header.
 *
 * Mount AFTER authenticate() and AFTER tenantContext().
 */
export function ensureTenantMatch(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  const tenantReq = req as TenantRequest;

  // If no tenant context resolved, let it pass — some routes (like /auth/me)
  // legitimately have no tenant context.
  if (!tenantReq.tenantId) {
    return next();
  }

  // If user isn't authenticated yet, let authenticate() handle it.
  if (!authReq.user?.tenantId) {
    return next();
  }

  if (authReq.user.tenantId !== tenantReq.tenantId) {
    return res.status(403).json({
      success: false,
      error: 'Tenant mismatch — the requested tenant does not match your session',
    });
  }

  next();
}