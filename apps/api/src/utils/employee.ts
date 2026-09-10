import { Teacher } from '../models/Teacher';
import { Tenant } from '../models/Tenant';

/**
 * Generate a per-tenant employee ID.
 * Format: EMP-YY-<TENANT_PREFIX>-NNNN  (e.g., EMP-24-DEL-0001)
 */
export async function generateEmployeeId(tenantId: string): Promise<string> {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new Error('Tenant not found');

  const year = new Date().getFullYear().toString().slice(-2);
  const count = await Teacher.countDocuments({ tenantId, isDeleted: false });
  const sequence = String(count + 1).padStart(4, '0');

  return `EMP-${year}-${tenant.slug.toUpperCase().slice(0, 3)}-${sequence}`;
}