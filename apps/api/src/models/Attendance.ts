import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  tenantId: string;
  date: Date;
  type: 'student' | 'teacher';
  entityId: string; // studentId or teacherId
  sectionId?: string;
  academicYearId: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'holiday';
  checkInTime?: Date;
  checkOutTime?: Date;
  markedBy: string; // userId who marked
  remarks?: string;
  isHoliday: boolean;
  holidayReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceSession extends Document {
  tenantId: string;
  academicYearId: string;
  sectionId: string;
  date: Date;
  type: 'student' | 'teacher';
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalHalfDay: number;
  totalStudents: number;
  attendancePercentage: number;
  markedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['student', 'teacher'],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    sectionId: {
      type: String,
      index: true,
    },
    academicYearId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half_day', 'holiday'],
      required: true,
    },
    checkInTime: Date,
    checkOutTime: Date,
    markedBy: {
      type: String,
      required: true,
    },
    remarks: String,
    isHoliday: {
      type: Boolean,
      default: false,
    },
    holidayReason: String,
  },
  {
    timestamps: true,
  }
);

const attendanceSessionSchema = new Schema<IAttendanceSession>(
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
    sectionId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['student', 'teacher'],
      required: true,
    },
    totalPresent: {
      type: Number,
      default: 0,
    },
    totalAbsent: {
      type: Number,
      default: 0,
    },
    totalLate: {
      type: Number,
      default: 0,
    },
    totalHalfDay: {
      type: Number,
      default: 0,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    attendancePercentage: {
      type: Number,
      default: 0,
    },
    markedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for uniqueness
attendanceSchema.index(
  { tenantId: 1, entityId: 1, date: 1, type: 1 },
  { unique: true }
);

attendanceSessionSchema.index(
  { tenantId: 1, sectionId: 1, date: 1, type: 1 },
  { unique: true }
);

// Additional indexes
attendanceSchema.index({ tenantId: 1, date: 1, sectionId: 1 });
attendanceSchema.index({ tenantId: 1, entityId: 1, status: 1 });
attendanceSessionSchema.index({ tenantId: 1, academicYearId: 1, sectionId: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
export const AttendanceSession = mongoose.model<IAttendanceSession>('AttendanceSession', attendanceSessionSchema);