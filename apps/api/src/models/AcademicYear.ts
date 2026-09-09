import mongoose, { Schema, Document } from 'mongoose';

export interface IAcademicYear extends Document {
  tenantId: string;
  name: string;
  code: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  status: 'active' | 'inactive' | 'archived';
  description?: string;
}

const academicYearSchema = new Schema<IAcademicYear>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
academicYearSchema.index({ tenantId: 1, code: 1 });
academicYearSchema.index({ tenantId: 1, isCurrent: 1 });

export const AcademicYear = mongoose.model<IAcademicYear>('AcademicYear', academicYearSchema);