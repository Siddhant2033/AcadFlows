import { BaseEntity, TenantScoped } from './common';

export interface AcademicYear extends BaseEntity, TenantScoped {
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'inactive' | 'archived';
}

export interface Grade extends BaseEntity, TenantScoped {
  name: string;
  sequence: number;
}

export interface Section extends BaseEntity, TenantScoped {
  gradeId: string;
  name: string;
  capacity: number;
}

export interface Subject extends BaseEntity, TenantScoped {
  code: string;
  name: string;
}