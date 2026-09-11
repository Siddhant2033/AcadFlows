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

/**
 * Get tenant slug from current URL.
 * Checks subdomain first, then ?tenant= query param.
 */
export function getTenantSlugFromURL(): string | null {
  if (typeof window === 'undefined') return null;

  const host = window.location.hostname;
  const parts = host.split('.');

  const reservedSubdomains = ['www', 'app', 'api', 'admin', 'localhost'];

  // Multi-part hostname (e.g. "dpsnoida.acadflows.in")
  if (parts.length >= 3) {
    const candidate = parts[0];
    if (candidate && !reservedSubdomains.includes(candidate)) {
      return candidate;
    }
  }
  // Two-part hostname (e.g. "dpsnoida.localhost" — dev subdomain)
  else if (parts.length === 2) {
    const candidate = parts[0];
    if (candidate && !candidate.includes('localhost') && !reservedSubdomains.includes(candidate)) {
      return candidate;
    }
  }

  const params = new URLSearchParams(window.location.search);
  const tenantParam = params.get('tenant');
  if (tenantParam) return tenantParam;

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
    console.error('Failed to fetch tenant by school code:', error);
    return null;
  }
}

/**
 * Get tenant info by slug.
 */
export async function getTenantInfo(slug: string): Promise<TenantInfo | null> {
  try {
    const response = await api.get(`/tenants/public/${slug}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch tenant info:', error);
    return null;
  }
}

/**
 * Get current tenant info.
 */
export async function getCurrentTenant(): Promise<TenantInfo | null> {
  try {
    const response = await api.get('/tenants/current');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch current tenant:', error);
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