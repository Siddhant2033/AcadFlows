import mongoose, { Schema, Document } from 'mongoose';
import { generateSchoolCode } from '../utils/random';

export interface ITenant extends Document {
  name: string;
  slug: string;
  schoolCode: string;
  status: 'active' | 'inactive' | 'archived';
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  settings: {
    academicYearStart: String,
    academicYearEnd: String,
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    language: { type: String, default: 'en-IN' },
    emailDomain: { type: String, trim: true, lowercase: true },
  },
}

const tenantSchema = new Schema<ITenant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      // unique handled by compound index
    },
    schoolCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      // No unique here — see compound index below
      // No default — assigned in TenantService
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    logoUrl: {
      type: String,
    },
    settings: {
      academicYearStart: String,
      academicYearEnd: String,
      timezone: { type: String, default: 'UTC' },
      currency: { type: String, default: 'USD' },
      language: { type: String, default: 'en' },
      emailDomain: { type: String, trim: true, lowercase: true },
    },
  },
  {
    timestamps: true,
  }
);

// REMOVE duplicate index definitions - they're already covered by unique: true
// tenantSchema.index({ slug: 1 });
// tenantSchema.index({ schoolCode: 1 });

// Keep only additional indexes not covered by unique
tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ schoolCode: 1 }, { unique: true });
tenantSchema.index({ status: 1 });

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);