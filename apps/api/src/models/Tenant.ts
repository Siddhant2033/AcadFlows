import mongoose, { Schema, Document } from 'mongoose';

export interface IGradingBand {
  grade: string;      // "A+", "A", "B+", etc.
  minPercent: number; // 90
  maxPercent: number; // 100
  points: number;     // 10
  description?: string;
}

export interface ITenantSettings {
  // Academic
  academicYearStart?: string;
  academicYearEnd?: string;
  timezone?: string;
  currency?: string;
  language?: string;
  emailDomain?: string;

  // Branding
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  motto?: string;
  affiliation?: string;       // CBSE, ICSE, State Board
  affiliationNumber?: string;

  // Grading
  gradingScale?: IGradingBand[];
  passingPercent?: number;

  // Fees
  feeDefaults?: {
    lateFeePercent?: number;
    gracePeriodDays?: number;
    currency?: string;
  };

  // Notifications
  notifications?: {
    attendanceAlertsEnabled?: boolean;
    feeRemindersEnabled?: boolean;
    lowAttendanceThreshold?: number;
  };
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
    // Academic
    academicYearStart: String,
    academicYearEnd: String,
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    language: { type: String, default: 'en-IN' },
    emailDomain: { type: String, trim: true, lowercase: true },

    // Branding
    logoUrl: String,
    primaryColor: { type: String, default: '#DF301C' },
    secondaryColor: { type: String, default: '#FF9100' },
    motto: String,
    affiliation: String,
    affiliationNumber: String,

    // Grading
    gradingScale: { type: [gradingBandSchema], default: () => DEFAULT_GRADING_SCALE },
    passingPercent: { type: Number, default: 40, min: 0, max: 100 },

    // Fees
    feeDefaults: {
      lateFeePercent: { type: Number, default: 0, min: 0, max: 100 },
      gracePeriodDays: { type: Number, default: 5, min: 0 },
      currency: { type: String, default: 'INR' },
    },

    // Notifications
    notifications: {
      attendanceAlertsEnabled: { type: Boolean, default: true },
      feeRemindersEnabled: { type: Boolean, default: true },
      lowAttendanceThreshold: { type: Number, default: 75, min: 0, max: 100 },
    },
  },
  { _id: false },
);

const tenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    schoolCode: { type: String, required: true, trim: true, uppercase: true },
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

tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ schoolCode: 1 }, { unique: true });
tenantSchema.index({ status: 1 });

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);
export { DEFAULT_GRADING_SCALE };