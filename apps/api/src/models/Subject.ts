import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  gradeId?: string;
  credits?: number;
  isElective: boolean;
  status: 'active' | 'inactive';
}

const subjectSchema = new Schema<ISubject>(
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
    description: {
      type: String,
      trim: true,
    },
    gradeId: {
      type: String,
      index: true,
    },
    credits: {
      type: Number,
      default: 1,
    },
    isElective: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

subjectSchema.index({ tenantId: 1, code: 1 });
subjectSchema.index({ tenantId: 1, gradeId: 1 });

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);