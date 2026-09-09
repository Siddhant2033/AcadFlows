import mongoose, { Schema, Document } from 'mongoose';

export interface ISection extends Document {
  tenantId: string;
  gradeId: string;
  name: string;
  code: string;
  capacity: number;
  teacherId?: string;
  roomNumber?: string;
  status: 'active' | 'inactive';
}

const sectionSchema = new Schema<ISection>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    gradeId: {
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
    capacity: {
      type: Number,
      required: true,
      default: 30,
    },
    teacherId: {
      type: String,
      index: true,
    },
    roomNumber: {
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

sectionSchema.index({ tenantId: 1, gradeId: 1 });
sectionSchema.index({ tenantId: 1, code: 1 });

export const Section = mongoose.model<ISection>('Section', sectionSchema);