import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
  tenantId: string;
  date: Date;
  dateOnly: string;
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
  dateOnly: string;
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
    dateOnly: {
      type: String,
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
attendanceSchema.index(
  { tenantId: 1, entityId: 1, type: 1, dateOnly: 1 },
  { unique: true }
);
attendanceSchema.index({ tenantId: 1, entityId: 1, status: 1 });
attendanceSessionSchema.index(
  { tenantId: 1, sectionId: 1, type: 1, dateOnly: 1 },
  { unique: true }
);

attendanceSchema.pre('save', function (next) {
  if (this.date && !this.dateOnly) {
    const d = new Date(this.date);
    // IST offset: +05:30
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(d.getTime() + istOffset);
    this.dateOnly = istDate.toISOString().split('T')[0];
  }
  next();
});

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
export const AttendanceSession = mongoose.model<IAttendanceSession>('AttendanceSession', attendanceSessionSchema);