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
}

export interface UserLoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}