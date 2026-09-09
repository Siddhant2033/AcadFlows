import mongoose, { Schema, Document } from 'mongoose';

export interface ISchedule extends Document {
  tenantId: string;
  academicYearId: string;
  gradeId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  roomNumber?: string;
  status: 'active' | 'inactive';
}

const scheduleSchema = new Schema<ISchedule>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    academicYearId: {
      type: String,
      required: true,
      index: true,
    },
    gradeId: {
      type: String,
      required: true,
      index: true,
    },
    sectionId: {
      type: String,
      required: true,
      index: true,
    },
    subjectId: {
      type: String,
      required: true,
      index: true,
    },
    teacherId: {
      type: String,
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: String,
      required: true,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
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

scheduleSchema.index({ tenantId: 1, sectionId: 1, dayOfWeek: 1 });
scheduleSchema.index({ tenantId: 1, teacherId: 1, dayOfWeek: 1 });

export const Schedule = mongoose.model<ISchedule>('Schedule', scheduleSchema);