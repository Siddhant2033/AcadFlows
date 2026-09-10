import { Student } from '../models/Student';
import { Tenant } from '../models/Tenant';

/**
 * Generate a per-tenant admission number.
 * Format: YY-<TENANT_PREFIX>-NNNN  (e.g., 24-DEL-0001)
 */
export async function generateAdmissionNo(tenantId: string): Promise<string> {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new Error('Tenant not found');

  const year = new Date().getFullYear().toString().slice(-2);
  const count = await Student.countDocuments({ tenantId, isDeleted: false });
  const sequence = String(count + 1).padStart(4, '0');

  return `${year}-${tenant.slug.toUpperCase().slice(0, 3)}-${sequence}`;
}