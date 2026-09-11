import api from './api';

export interface TenantInfo {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  schoolCode: string;
  formattedSchoolCode: string;
  logoUrl?: string;
  settings?: {
    currency?: string;
    timezone?: string;
    language?: string;
    emailDomain?: string;
  };
}

export interface SchoolCodeValidation {
  valid: boolean;
  tenant?: {
    id: string;
    name: string;
    schoolCode: string;
    formattedSchoolCode: string;
  };
}

/* ─────────────────────────────────────────────────────────────
   Hosts that are NEVER tenant subdomains — the platform's own
   infrastructure. If the app is hosted on any of these, we skip
   subdomain-based tenant detection entirely.
   ───────────────────────────────────────────────────────────── */

const PLATFORM_HOST_SUFFIXES = [
  'vercel.app',
  'onrender.com',
  'render.com',
  'netlify.app',
  'railway.app',
  'fly.dev',
  'herokuapp.com',
  'localhost',
  '127.0.0.1',
];

/** Subdomains that are reserved even on the tenant's own domain */
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'dashboard',
  'portal',
  'auth',
  'mail',
  'static',
  'cdn',
  'assets',
]);

/**
 * Returns true if the current host is a platform host (Vercel, Render, etc.)
 * For those, we NEVER treat the first part as a tenant subdomain.
 */
function isPlatformHost(hostname: string): boolean {
  return PLATFORM_HOST_SUFFIXES.some(
    suffix => hostname === suffix || hostname.endsWith(`.${suffix}`),
  );
}

/**
 * Get tenant slug from current URL.
 *
 * Priority:
 *   1. ?tenant= query param (always wins)
 *   2. Subdomain — only if the host is NOT a platform host
 *   3. URL path prefix /t/<slug> (optional)
 *
 * Returns null if no tenant slug can be resolved.
 */
export function getTenantSlugFromURL(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Query param wins
  const params = new URLSearchParams(window.location.search);
  const tenantParam = params.get('tenant');
  if (tenantParam) return tenantParam;

  const hostname = window.location.hostname;

  // 2. Skip subdomain detection on platform hosts
  if (isPlatformHost(hostname)) {
    return null;
  }

  // 3. Subdomain detection (only on custom domains like dpsnoida.acadflows.in)
  const parts = hostname.split('.');

  if (parts.length >= 3) {
    const candidate = parts[0];
    if (candidate && !RESERVED_SUBDOMAINS.has(candidate)) {
      return candidate;
    }
  }

  // Two-part hostname (e.g., "dpsnoida.localhost" in dev)
  if (parts.length === 2) {
    const candidate = parts[0];
    if (candidate && candidate !== 'localhost' && !RESERVED_SUBDOMAINS.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Validate a school code.
 */
export async function validateSchoolCode(
  schoolCode: string,
): Promise<SchoolCodeValidation> {
  try {
    const response = await api.post('/tenants/validate-code', { schoolCode });

    if (response.data.success && response.data.data) {
      return { valid: true, tenant: response.data.data };
    }

    return { valid: false };
  } catch (error: any) {
    if (error.response?.status === 404) return { valid: false };
    if (error.response?.status === 400) return { valid: false };
    throw error;
  }
}

/**
 * Get tenant info by school code.
 */
export async function getTenantBySchoolCode(
  schoolCode: string,
): Promise<TenantInfo | null> {
  try {
    const response = await api.get(`/tenants/public/code/${schoolCode}`);
    return response.data.data;
  } catch (error) {
    // Silently swallow — callers handle null as "not found"
    return null;
  }
}

/**
 * Get tenant info by slug.
 * Returns null on 404 (no noisy console errors).
 */
export async function getTenantInfo(slug: string): Promise<TenantInfo | null> {
  if (!slug || slug.trim() === '') {
    return null;
  }

  try {
    const response = await api.get(`/tenants/public/${slug}`);
    return response.data.data;
  } catch (error: any) {
    // 404 is expected — the slug just doesn't exist.
    // Don't log to console; the caller handles null gracefully.
    if (error?.response?.status !== 404) {
      console.warn('Failed to fetch tenant info:', error?.message);
    }
    return null;
  }
}

/**
 * Get current tenant info (based on the request's tenant context).
 */
export async function getCurrentTenant(): Promise<TenantInfo | null> {
  try {
    const response = await api.get('/tenants/current');
    return response.data.data;
  } catch (error: any) {
    if (error?.response?.status !== 404) {
      console.warn('Failed to fetch current tenant:', error?.message);
    }
    return null;
  }
}

/**
 * Validate tenant ID.
 */
export async function validateTenant(tenantId: string): Promise<boolean> {
  try {
    const response = await api.get(`/tenants/validate/${tenantId}`);
    return response.data.data.isValid;
  } catch {
    return false;
  }
}

/**
 * Get tenant display name for UI.
 */
export function getTenantDisplayName(tenant: TenantInfo | null): string {
  if (!tenant) return 'School';
  return tenant.name || tenant.slug || 'School';
}

/**
 * Format school code for display.
 */
export function formatSchoolCodeForDisplay(code: string): string {
  if (!code) return '';
  const clean = code.replace(/[-\s]/g, '').toUpperCase();
  if (clean.length !== 10) return code;
  return `${clean.substring(0, 4)}-${clean.substring(4, 8)}-${clean.substring(8, 10)}`;
}

/**
 * Create a new school (for admin registration).
 */
export async function createSchool(data: {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}): Promise<TenantInfo> {
  const response = await api.post('/tenants/create-school', data);

  const schoolData = response.data.data;
  if (schoolData && schoolData._id && !schoolData.id) {
    schoolData.id = schoolData._id;
  }
  if (schoolData && schoolData.id && !schoolData._id) {
    schoolData._id = schoolData.id;
  }

  return schoolData;
}