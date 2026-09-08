export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantScoped {
  tenantId: string;
}

export type Status = 'active' | 'inactive' | 'archived';
export type Role = 'admin' | 'teacher' | 'student' | 'guardian';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}