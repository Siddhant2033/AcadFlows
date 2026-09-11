import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Tenant } from '../models/Tenant';
import { config } from '../config';

export interface TenantRequest extends Request {
  tenantId?: string;
  tenant?: any;
  isSubdomainTenant?: boolean;
}

/* ─────────────────────────────────────────────────────────────
   In-memory tenant cache
   
   Keyed by the resolution "source" (subdomain slug, header ID, etc.),
   storing { tenant, expiresAt }. Avoids hitting MongoDB on every
   request in a multi-tenant app where the same school is hit
   repeatedly.
   ───────────────────────────────────────────────────────────── */

const TENANT_CACHE_TTL_MS = 60 * 1000; // 60 seconds
const tenantCache = new Map<string, { tenant: any | null; expiresAt: number }>();

function getCached(key: string) {
  const entry = tenantCache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    tenantCache.delete(key);
    return undefined;
  }
  return entry.tenant;
}

function setCached(key: string, tenant: any | null) {
  tenantCache.set(key, {
    tenant,
    expiresAt: Date.now() + TENANT_CACHE_TTL_MS,
  });

  // Simple eviction: cap the cache at 1000 entries to avoid unbounded growth.
  if (tenantCache.size > 1000) {
    const firstKey = tenantCache.keys().next().value;
    if (firstKey !== undefined) tenantCache.delete(firstKey);
  }
}

// Cleanup expired entries periodically (optional, keeps memory tidy).
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of tenantCache.entries()) {
    if (entry.expiresAt < now) tenantCache.delete(key);
  }
}, TENANT_CACHE_TTL_MS).unref?.();

/**
 * Subdomains that are NEVER tenant slugs. Prevents wasted DB lookups for
 * the platform's own hosts (`acadflows.onrender.com`, `*.vercel.app`, etc.).
 */
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'localhost',
  'acadflows',   // backend host
  'render',
  'onrender',
  'vercel',
  'netlify',
]);

/**
 * Extract the tenant slug from the request host, if any.
 */
function extractSubdomainSlug(host: string): string | null {
  if (!host) return null;

  // Strip port (e.g. "localhost:5000" → "localhost")
  const hostname = host.split(':')[0];
  if (!hostname) return null;

  const parts = hostname.split('.');
  if (parts.length < 2) return null;

  const candidate = parts[0];
  if (!candidate) return null;
  if (RESERVED_SUBDOMAINS.has(candidate)) return null;

  return candidate;
}

/**
 * Tenant Context Middleware
 * Resolves the tenant from multiple sources with caching.
 */
export async function tenantContext(req: Request, res: Response, next: NextFunction) {
  // Skip tenant resolution for auth routes (except /auth/me)
  if (req.path.includes('/auth/') && !req.path.includes('/auth/me')) {
    return next();
  }

  if (req.path === '/health') {
    return next();
  }

  let tenantId: string | null = null;
  let tenant: any = null;

  try {
    // 1. Subdomain
    const host = req.get('host') || '';
    const slug = extractSubdomainSlug(host);
    if (slug) {
      const cacheKey = `slug:${slug}`;
      let cached = getCached(cacheKey);
      if (cached === undefined) {
        cached = await Tenant.findOne({ slug, status: 'active' });
        setCached(cacheKey, cached);
      }
      if (cached) {
        tenant = cached;
        tenantId = cached._id.toString();
      }
    }

    // 2. X-Tenant-Id header
    if (!tenantId) {
      const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
      if (headerTenantId) {
        const cacheKey = `header:${headerTenantId}`;
        let cached = getCached(cacheKey);
        if (cached === undefined) {
          if (mongoose.Types.ObjectId.isValid(headerTenantId)) {
            cached = await Tenant.findById(headerTenantId);
          } else {
            cached = await Tenant.findOne({ slug: headerTenantId, status: 'active' });
          }
          setCached(cacheKey, cached);
        }
        if (cached) {
          tenant = cached;
          tenantId = cached._id.toString();
        }
      }
    }

    // 3. Query param
    if (!tenantId && req.query.tenantId) {
      const queryTenantId = req.query.tenantId as string;
      const cacheKey = `query:${queryTenantId}`;
      let cached = getCached(cacheKey);
      if (cached === undefined) {
        if (mongoose.Types.ObjectId.isValid(queryTenantId)) {
          cached = await Tenant.findById(queryTenantId);
        } else {
          cached = await Tenant.findOne({ slug: queryTenantId, status: 'active' });
        }
        setCached(cacheKey, cached);
      }
      if (cached) {
        tenant = cached;
        tenantId = cached._id.toString();
      }
    }

    // 4. Cookie
    if (!tenantId && req.cookies?.tenantId) {
      const cookieTenantId = req.cookies.tenantId;
      const cacheKey = `cookie:${cookieTenantId}`;
      let cached = getCached(cacheKey);
      if (cached === undefined) {
        if (mongoose.Types.ObjectId.isValid(cookieTenantId)) {
          cached = await Tenant.findById(cookieTenantId);
        } else {
          cached = await Tenant.findOne({ slug: cookieTenantId, status: 'active' });
        }
        setCached(cacheKey, cached);
      }
      if (cached) {
        tenant = cached;
        tenantId = cached._id.toString();
      }
    }

    // 5. Development fallback — first active tenant
    if (!tenantId && process.env.NODE_ENV === 'development') {
      const cacheKey = 'dev:any';
      let cached = getCached(cacheKey);
      if (cached === undefined) {
        const defaultTenant = await Tenant.findOne({
          slug: config.tenant.defaultSlug || 'default',
          status: 'active',
        });
        cached = defaultTenant || (await Tenant.findOne({ status: 'active' }));
        setCached(cacheKey, cached);
      }
      if (cached) {
        tenant = cached;
        tenantId = cached._id.toString();
      }
    }

    // Attach tenant info if found
    if (tenantId && tenant) {
      (req as TenantRequest).tenantId = tenantId;
      (req as TenantRequest).tenant = tenant;

      if (!req.cookies?.tenantId || req.cookies.tenantId !== tenantId) {
        res.cookie('tenantId', tenantId, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000,
          path: '/',
        });
      }
    }

    next();
  } catch (error) {
    console.error('Tenant context error:', error);
    next();
  }
}

/**
 * Middleware to require a tenant context.
 */
export function requireTenant() {
  return (req: Request, res: Response, next: NextFunction) => {
    const tenantReq = req as TenantRequest;
    if (!tenantReq.tenantId || !tenantReq.tenant) {
      return res.status(400).json({
        success: false,
        error: 'Tenant context is required for this operation',
      });
    }
    next();
  };
}