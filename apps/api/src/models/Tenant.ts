import mongoose, { Schema, Document } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  slug: string;
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
      unique: true,  // This creates the index
      trim: true,
      lowercase: true,
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
    },
  },
  {
    timestamps: true,
  }
);

// Remove this duplicate index - it's already covered by unique: true above
// tenantSchema.index({ slug: 1 });

// Keep only additional indexes that aren't covered by unique/schema options
tenantSchema.index({ status: 1 });

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);