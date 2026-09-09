import { BaseEntity, TenantScoped } from './common';

export interface Student extends BaseEntity, TenantScoped {
  userId: string;
  admissionNo: string;
  grade: string;
  section?: string;
  dateOfBirth?: Date;
  guardians: {
    name: string;
    phone?: string;
    email?: string;
    relationship: string;
  }[];
  address?: string;
  enrollments: {
    academicYearId: string;
    sectionId: string;
    rollNo?: string;
  }[];
}