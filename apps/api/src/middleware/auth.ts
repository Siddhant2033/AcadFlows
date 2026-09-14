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

/* ─────────────────────────────────────────────────────────────
   authenticate — verifies the JWT and attaches req.user
   ───────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────────
   requireRole — restricts a route to specific roles
   ───────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────────
   ensureTenantMatch — verifies the request's tenant matches the JWT
   
   IMPORTANT: This middleware MUST run after `authenticate`.
   If a route accidentally mounts it standalone, we now return 401
   instead of silently allowing the request through (which caused
   the "Cannot read properties of undefined" crash).
   ───────────────────────────────────────────────────────────── */

export function ensureTenantMatch(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthRequest;
  const tenantReq = req as TenantRequest;

  // Authenticate must have run first. If not, reject loudly.
  if (!authReq.user?.tenantId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  // If no tenant context resolved from headers/cookies, we can't compare.
  // In that case, trust the JWT (the tenant is already baked in).
  if (!tenantReq.tenantId) {
    return next();
  }

  // If the resolved tenant doesn't match the JWT's tenant, reject.
  if (authReq.user.tenantId !== tenantReq.tenantId) {
    return res.status(403).json({
      success: false,
      error: 'Tenant mismatch — the requested tenant does not match your session',
    });
  }

  next();
}