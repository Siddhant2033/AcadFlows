import mongoose, { Schema, Document } from 'mongoose';

export interface IGrade extends Document {
  tenantId: string;
  name: string;
  code: string;
  sequence: number;
  description?: string;
  status: 'active' | 'inactive';
}

const gradeSchema = new Schema<IGrade>(
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
      trim: true,
      uppercase: true,
    },
    sequence: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
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

gradeSchema.index({ tenantId: 1, code: 1 }, { unique: true });
gradeSchema.index({ tenantId: 1, sequence: 1 });

export const Grade = mongoose.model<IGrade>('Grade', gradeSchema);