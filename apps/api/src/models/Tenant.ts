import mongoose, { Schema, Document } from 'mongoose';

export interface IGradingBand {
  grade: string;
  minPercent: number;
  maxPercent: number;
  points: number;
  description?: string;
}

export interface ITenantSettings {
  academicYearStart?: string;
  academicYearEnd?: string;
  timezone?: string;
  currency?: string;
  language?: string;
  emailDomain?: string;

  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  motto?: string;
  affiliation?: string;
  affiliationNumber?: string;

  gradingScale?: IGradingBand[];
  passingPercent?: number;

  feeDefaults?: {
    lateFeePercent?: number;
    gracePeriodDays?: number;
    currency?: string;
  };

  notifications?: {
    attendanceAlertsEnabled?: boolean;
    feeRemindersEnabled?: boolean;
    lowAttendanceThreshold?: number;
  };

  allowedTeacherEmailDomains?: string[];
}

export type TenantStatus =
  | 'pending'
  | 'active'
  | 'suspended'
  | 'rejected'
  | 'inactive'
  | 'archived';

export interface ITenant extends Document {
  name: string;
  slug: string;
  schoolCode: string;
  status: TenantStatus;

  // Approval workflow
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  suspendedAt?: Date;
  suspendedReason?: string;

  // Registration audit
  registrationIp?: string;
  registrationUserAgent?: string;

  // Code management
  codeGeneratedAt?: Date;
  codeExpiresAt?: Date;

  // School info
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  settings: ITenantSettings;

  createdAt: Date;
  updatedAt: Date;
}

const gradingBandSchema = new Schema<IGradingBand>(
  {
    grade: { type: String, required: true, trim: true },
    minPercent: { type: Number, required: true, min: 0, max: 100 },
    maxPercent: { type: Number, required: true, min: 0, max: 100 },
    points: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
  },
  { _id: false },
);

const DEFAULT_GRADING_SCALE: IGradingBand[] = [
  { grade: 'A+', minPercent: 90, maxPercent: 100, points: 10 },
  { grade: 'A', minPercent: 80, maxPercent: 89.99, points: 9 },
  { grade: 'B+', minPercent: 70, maxPercent: 79.99, points: 8 },
  { grade: 'B', minPercent: 60, maxPercent: 69.99, points: 7 },
  { grade: 'C+', minPercent: 50, maxPercent: 59.99, points: 6 },
  { grade: 'C', minPercent: 40, maxPercent: 49.99, points: 5 },
  { grade: 'F', minPercent: 0, maxPercent: 39.99, points: 0 },
];

const tenantSettingsSchema = new Schema<ITenantSettings>(
  {
    academicYearStart: String,
    academicYearEnd: String,
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    language: { type: String, default: 'en-IN' },
    emailDomain: { type: String, trim: true, lowercase: true },

    logoUrl: String,
    primaryColor: { type: String, default: '#DF301C' },
    secondaryColor: { type: String, default: '#FF9100' },
    motto: String,
    affiliation: String,
    affiliationNumber: String,

    gradingScale: { type: [gradingBandSchema], default: () => DEFAULT_GRADING_SCALE },
    passingPercent: { type: Number, default: 40, min: 0, max: 100 },

    feeDefaults: {
      lateFeePercent: { type: Number, default: 0, min: 0, max: 100 },
      gracePeriodDays: { type: Number, default: 5, min: 0 },
      currency: { type: String, default: 'INR' },
    },

    notifications: {
      attendanceAlertsEnabled: { type: Boolean, default: true },
      feeRemindersEnabled: { type: Boolean, default: true },
      lowAttendanceThreshold: { type: Number, default: 75, min: 0, max: 100 },
    },

    allowedTeacherEmailDomains: { type: [String], default: [] },
  },
  { _id: false },
);

const tenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },

    // ⚠️ No index: true — the unique index is declared below
    schoolCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    // ⚠️ No index: true — the index is declared below
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'rejected', 'inactive', 'archived'],
      default: 'pending',
    },

    // Approval
    emailVerified: { type: Boolean, default: false },
    // ⚠️ No index: true — the index is declared below
    verificationToken: { type: String },
    verificationTokenExpiresAt: Date,
    approvedBy: String,
    approvedAt: Date,
    rejectedBy: String,
    rejectedAt: Date,
    rejectionReason: String,
    suspendedAt: Date,
    suspendedReason: String,

    // Registration audit
    registrationIp: String,
    registrationUserAgent: String,

    // Code management
    codeGeneratedAt: Date,
    codeExpiresAt: Date,

    // School info
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

/* ─────────────────────────────────────────────────────────────
   Indexes — declared ONLY here, not on the field itself
   ───────────────────────────────────────────────────────────── */

tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ schoolCode: 1 }, { unique: true });
tenantSchema.index({ status: 1 });
tenantSchema.index({ verificationToken: 1 });

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);
export { DEFAULT_GRADING_SCALE };