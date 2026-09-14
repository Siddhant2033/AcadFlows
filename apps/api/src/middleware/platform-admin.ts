import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import type { AuthRequest } from './auth';

/**
 * Restricts access to the platform admin (founder).
 *
 * Requires:
 *   1. User is authenticated
 *   2. User's email matches PLATFORM_ADMIN_EMAIL env var
 *
 * If PLATFORM_ADMIN_EMAIL is not set, all requests are rejected.
 */
export function requirePlatformAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authReq = req as AuthRequest;

  if (!config.platformAdmin.email) {
    return res.status(500).json({
      success: false,
      error:
        'PLATFORM_ADMIN_EMAIL is not configured. Contact the system administrator.',
    });
  }

  if (!authReq.user?.email) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (authReq.user.email !== config.platformAdmin.email) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden — platform admin access required',
    });
  }

  next();
}