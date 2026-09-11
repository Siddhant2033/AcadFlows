import mongoose, { Schema, Document } from 'mongoose';

export interface ITenantSettings {
  academicYearStart?: string;
  academicYearEnd?: string;
  timezone?: string;
  currency?: string;
  language?: string;
  emailDomain?: string;
}

export interface ITenant extends Document {
  name: string;
  slug: string;
  schoolCode: string;
  status: 'active' | 'inactive' | 'archived';
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  settings: ITenantSettings;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSettingsSchema = new Schema<ITenantSettings>(
  {
    academicYearStart: String,
    academicYearEnd: String,
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    language: { type: String, default: 'en-IN' },
    emailDomain: { type: String, trim: true, lowercase: true },
  },
  { _id: false },
);

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
    },
    schoolCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    logoUrl: { type: String },
    settings: {
      type: tenantSettingsSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

// Unique indexes
tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ schoolCode: 1 }, { unique: true });
tenantSchema.index({ status: 1 });

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);