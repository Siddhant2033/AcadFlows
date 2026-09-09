import mongoose, { Schema, Document } from 'mongoose';
import { generateSchoolCode } from '../utils/school-code';

export interface ITenant extends Document {
  name: string;
  slug: string;
  schoolCode: string;
  status: 'active' | 'inactive' | 'archived';
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  settings?: {
    academicYearStart?: string;
    academicYearEnd?: string;
    timezone?: string;
    currency?: string;
    language?: string;
    emailDomain?: string;
  };
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
      unique: true, // This creates the index
      trim: true,
      lowercase: true,
    },
    schoolCode: {
      type: String,
      required: true,
      unique: true, // This creates the index
      trim: true,
      uppercase: true,
      default: function() {
        return generateSchoolCode();
      },
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
tenantSchema.index({ status: 1 });

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);