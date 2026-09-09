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
 */
export async function tenantContext(req: Request, res: Response, next: NextFunction) {
  let tenantId: string | null = null;
  let tenant: any = null;
  let isSubdomainTenant = false;

  try {
    // 1. Try to get tenant from subdomain
    const host = req.get('host') || '';
    const hostParts = host.split('.');
    
    // Check if we have a subdomain (more than 2 parts or localhost with 3 parts)
    // Examples: 
    // - school-a.localhost:5000 → subdomain = school-a
    // - school-a.example.com → subdomain = school-a
    // - localhost:5000 → no subdomain
    // - app.localhost:5000 → subdomain = app (reserved, skip)
    const reservedSubdomains = ['www', 'app', 'api', 'admin', 'localhost'];
    
    let subdomain: string | null = null;
    if (hostParts.length >= 3) {
      // For localhost: school-a.localhost:5000
      subdomain = hostParts[0];
    } else if (hostParts.length === 2 && !hostParts[0].includes('localhost')) {
      // For production: school-a.example.com
      subdomain = hostParts[0];
    }

    // Check if subdomain is valid and not reserved
    if (subdomain && !reservedSubdomains.includes(subdomain)) {
      // Try to find tenant by slug
      tenant = await Tenant.findOne({ 
        slug: subdomain, 
        status: 'active' 
      });
      
      if (tenant) {
        tenantId = tenant._id.toString();
        isSubdomainTenant = true;
      }
    }

    // 2. If no tenant from subdomain, try header
    if (!tenantId) {
      const headerTenantId = req.headers['x-tenant-id'] as string;
      if (headerTenantId) {
        // Check if it's a valid ObjectId or slug
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
      // Try to get default tenant from config
      const defaultTenant = mongoose.Types.ObjectId.isValid(config.tenant.defaultId)
        ? await Tenant.findOne({ _id: config.tenant.defaultId, status: 'active' })
        : await Tenant.findOne({ slug: config.tenant.defaultId, status: 'active' });
      
      if (defaultTenant) {
        tenantId = defaultTenant._id.toString();
        tenant = defaultTenant;
      } else {
        // If no default tenant exists, try to find any active tenant
        const anyTenant = await Tenant.findOne({ status: 'active' });
        if (anyTenant) {
          tenantId = anyTenant._id.toString();
          tenant = anyTenant;
        }
      }
    }

    // If still no tenant, throw error
    if (!tenantId) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(400).json({
          success: false,
          error: 'Tenant not found. Please provide a valid tenant identifier.',
          message: 'Try using: subdomain, X-Tenant-ID header, or tenantId query parameter'
        });
      } else {
        // In development, allow proceeding with a warning
        console.warn('⚠️ No tenant found in request. Using default tenant.');
        // Try to get any tenant as fallback
        const fallbackTenant = await Tenant.findOne({ status: 'active' });
        if (fallbackTenant) {
          tenantId = fallbackTenant._id.toString();
          tenant = fallbackTenant;
        } else {
          // Create a default tenant if none exists (development only)
          const defaultTenant = await Tenant.create({
            name: 'Default School',
            slug: 'default',
            status: 'active'
          });
          tenantId = defaultTenant._id.toString();
          tenant = defaultTenant;
        }
      }
    }

    // Attach tenant info to request
    (req as TenantRequest).tenantId = tenantId;
    (req as TenantRequest).tenant = tenant;
    (req as TenantRequest).isSubdomainTenant = isSubdomainTenant;

    // Set tenant cookie for subsequent requests
    if (!req.cookies?.tenantId || req.cookies.tenantId !== tenantId) {
      res.cookie('tenantId', tenantId, {
        httpOnly: false, // Can be read by frontend
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/'
      });
    }

    next();
  } catch (error) {
    console.error('Tenant context error:', error);
    next(new AppError('Failed to resolve tenant context', 500));
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

/**
 * Get tenant from request
 */
export function getTenant(req: Request): any {
  return (req as TenantRequest).tenant;
}

/**
 * Get tenant ID from request
 */
export function getTenantId(req: Request): string {
  return (req as TenantRequest).tenantId;
}

/**
 * Check if tenant was resolved from subdomain
 */
export function isSubdomainTenant(req: Request): boolean {
  return (req as TenantRequest).isSubdomainTenant || false;
}