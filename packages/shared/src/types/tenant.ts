import { BaseEntity, Status } from './common';

export interface Tenant extends BaseEntity {
  name: string;
  slug: string;
  status: Status;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  settings?: TenantSettings;
}

export interface TenantSettings {
  academicYearStart?: string;
  academicYearEnd?: string;
  timezone?: string;
  currency?: string;
  currencySymbol?: string;
  language?: string;
  country?: string;
  phoneCode?: string;
  dateFormat?: string;
}