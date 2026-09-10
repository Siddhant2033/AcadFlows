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

export interface AddressInput {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ChildLinkInput {
  studentId: string;
  name?: string;
  grade?: string;
  rollNo?: string;
}

export interface UserCreateInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  tenantId: string;

  // ── Shared optional ──
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';

  // ── Student ──
  grade?: string;
  section?: string;
  sectionId?: string;
  address?: AddressInput;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;

  // ── Teacher ──
  employeeId?: string;
  subject?: string;
  qualification?: string;
  experience?: string | number;
  joiningDate?: string;

  // ── Guardian ──
  relationship?: string;
  occupation?: string;
  children?: ChildLinkInput[];
}

export interface UserLoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}