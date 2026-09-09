import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Tenant } from '../models/Tenant';
import { config } from '../config';
import { AppError } from './error-handler';

export interface TenantRequest extends Request {
  tenantId: string;
  tenant?: any;
  isSubdomainTenant?: boolean;
}

/**
 * Tenant Context Middleware
 * Resolves tenant from:
 * 1. Subdomain (e.g., school-a.localhost:5000)
 * 2. X-Tenant-ID header (for API clients)
 * 3. Slug in URL path (fallback for development)
 * 4. Default tenant (development only)
 * 
 * NOTE: This middleware does NOT require authentication.
 * It only resolves the tenant context if available.
 */
export async function tenantContext(req: Request, res: Response, next: NextFunction) {
  let tenantId: string | null = null;
  let tenant: any = null;
  let isSubdomainTenant = false;

  try {
    // Skip tenant resolution for auth routes (they handle tenant differently)
    if (req.path.includes('/auth/') && !req.path.includes('/auth/me')) {
      return next();
    }

    // 1. Try to get tenant from subdomain
    const host = req.get('host') || '';
    const hostParts = host.split('.');
    
    const reservedSubdomains = ['www', 'app', 'api', 'admin', 'localhost'];
    
    let subdomain: string | null = null;
    if (hostParts.length >= 3) {
      subdomain = hostParts[0];
    } else if (hostParts.length === 2 && !hostParts[0].includes('localhost')) {
      subdomain = hostParts[0];
    }

    if (subdomain && !reservedSubdomains.includes(subdomain)) {
      tenant = await Tenant.findOne({ 
        slug: subdomain, 
        status: 'active' 
      });
      
      if (tenant) {
        tenantId = tenant._id.toString();
        isSubdomainTenant = true;
      }
    }

    // 2. Try header (but only if not already resolved)
    if (!tenantId) {
      const headerTenantId = req.headers['x-tenant-id'] as string;
      if (headerTenantId) {
        if (mongoose.Types.ObjectId.isValid(headerTenantId)) {
          tenant = await Tenant.findById(headerTenantId);
        } else {
          tenant = await Tenant.findOne({ slug: headerTenantId, status: 'active' });
        }
        
        if (tenant) {
          tenantId = tenant._id.toString();
        }
      }
    }

    // 3. Try query parameter (fallback for development)
    if (!tenantId && req.query.tenantId) {
      const queryTenantId = req.query.tenantId as string;
      if (mongoose.Types.ObjectId.isValid(queryTenantId)) {
        tenant = await Tenant.findById(queryTenantId);
      } else {
        tenant = await Tenant.findOne({ slug: queryTenantId, status: 'active' });
      }
      
      if (tenant) {
        tenantId = tenant._id.toString();
      }
    }

    // 4. Try cookie (for maintaining tenant session)
    if (!tenantId && req.cookies?.tenantId) {
      const cookieTenantId = req.cookies.tenantId;
      if (mongoose.Types.ObjectId.isValid(cookieTenantId)) {
        tenant = await Tenant.findById(cookieTenantId);
      } else {
        tenant = await Tenant.findOne({ slug: cookieTenantId, status: 'active' });
      }
      
      if (tenant) {
        tenantId = tenant._id.toString();
      }
    }

    // 5. Fallback to default tenant (development only)
    if (!tenantId && process.env.NODE_ENV === 'development') {
      const defaultTenant = await Tenant.findOne({ 
        slug: config.tenant.defaultSlug || 'default',
        status: 'active' 
      });
      
      if (defaultTenant) {
        tenantId = defaultTenant._id.toString();
        tenant = defaultTenant;
      } else {
        // Try to find any active tenant
        const anyTenant = await Tenant.findOne({ status: 'active' });
        if (anyTenant) {
          tenantId = anyTenant._id.toString();
          tenant = anyTenant;
        }
      }
    }

    // Attach tenant info to request if found
    if (tenantId && tenant) {
      (req as TenantRequest).tenantId = tenantId;
      (req as TenantRequest).tenant = tenant;
      (req as TenantRequest).isSubdomainTenant = isSubdomainTenant;

      // Set tenant cookie for subsequent requests
      if (!req.cookies?.tenantId || req.cookies.tenantId !== tenantId) {
        res.cookie('tenantId', tenantId, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000,
          path: '/'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Tenant context error:', error);
    // Don't block the request, just log the error
    next();
  }
}

/**
 * Middleware to require a tenant context
 * Use on routes that must have a valid tenant
 */
export function requireTenant() {
  return (req: Request, res: Response, next: NextFunction) => {
    const tenantReq = req as TenantRequest;
    if (!tenantReq.tenantId || !tenantReq.tenant) {
      return res.status(400).json({
        success: false,
        error: 'Tenant context is required for this operation'
      });
    }
    next();
  };
}