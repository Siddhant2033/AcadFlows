import { BaseEntity, TenantScoped, Role, Status } from './common';

export interface User extends BaseEntity, TenantScoped {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: Status;
  lastLoginAt?: Date;
}

export interface UserCreateInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  tenantId: string;

  // Optional role-specific fields (all accepted by registerSchema)
  grade?: string;
  section?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  employeeId?: string;
  subject?: string;
  qualification?: string;
  experience?: string | number;
  joiningDate?: string;
  relationship?: string;
  occupation?: string;
  children?: any[];
}

export interface UserLoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}