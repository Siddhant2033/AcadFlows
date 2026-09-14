export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantScoped {
  tenantId: string;
}

/**
 * General status used across all entities.
 * Expanded to support the approval workflow (Sprint 1+).
 *
 *  - pending   : Registered, waiting for approval
 *  - active    : Approved, fully usable
 *  - suspended : Temporarily disabled (e.g. non-payment, policy violation)
 *  - rejected  : Rejected by an approver
 *  - inactive  : Legacy / soft-disabled
 *  - archived  : Legacy / historical
 */
export type Status =
  | 'pending'
  | 'active'
  | 'suspended'
  | 'rejected'
  | 'inactive'
  | 'archived';

export type Role = 'admin' | 'teacher' | 'student' | 'guardian';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}