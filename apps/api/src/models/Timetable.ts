import mongoose, { Schema, Document } from 'mongoose';

export interface ITimetable extends Document {
  tenantId: string;
  academicYearId: string;
  name: string;
  description?: string;
  type: 'regular' | 'exam' | 'holiday' | 'special';
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  // Note: entries live in the separate TimetableEntry collection
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimetableEntry extends Document {
  tenantId: string;
  timetableId: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId: string;
  sectionId: string;
  gradeId: string;
  roomId?: string;
  roomNumber?: string;
  isBreak: boolean;
  breakType?: 'short' | 'lunch' | 'recess';
  isOptional: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoom extends Document {
  tenantId: string;
  name: string;
  code: string;
  type: 'classroom' | 'laboratory' | 'library' | 'auditorium' | 'office' | 'other';
  capacity: number;
  floor?: string;
  building?: string;
  facilities?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimeSlot extends Document {
  tenantId: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  type: 'class' | 'break' | 'assembly' | 'other';
  name?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IValidationProps {
  value: string;
}

// Timetable Schema
const timetableEntrySchema = new Schema<ITimetableEntry>({
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  timetableId: {
    type: String,
    required: true,
    index: true,
  },
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true,
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string): boolean {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: (props: IValidationProps): string => `${props.value} is not a valid time format (HH:MM)`,
    },
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string): boolean {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: (props: IValidationProps): string => `${props.value} is not a valid time format (HH:MM)`,
    },
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
  sectionId: {
    type: String,
    required: true,
    index: true,
  },
  gradeId: {
    type: String,
    required: true,
    index: true,
  },
  roomId: String,
  roomNumber: String,
  isBreak: {
    type: Boolean,
    default: false,
  },
  breakType: {
    type: String,
    enum: ['short', 'lunch', 'recess'],
  },
  isOptional: {
    type: Boolean,
    default: false,
  },
  notes: String,
}, {
  timestamps: true,
});

const timetableSchema = new Schema<ITimetable>(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    type: {
      type: String,
      enum: ['regular', 'exam', 'holiday', 'special'],
      default: 'regular',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Room Schema
const roomSchema = new Schema<IRoom>(
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
    type: {
      type: String,
      enum: ['classroom', 'laboratory', 'library', 'auditorium', 'office', 'other'],
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    floor: String,
    building: String,
    facilities: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Time Slot Schema
const timeSlotSchema = new Schema<ITimeSlot>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['class', 'break', 'assembly', 'other'],
      default: 'class',
    },
    name: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
timetableSchema.index({ tenantId: 1, academicYearId: 1, isActive: 1 });
timetableSchema.index({ tenantId: 1, type: 1, startDate: 1, endDate: 1 });

timetableEntrySchema.index({ tenantId: 1, timetableId: 1, dayOfWeek: 1 });
timetableEntrySchema.index({ tenantId: 1, teacherId: 1, dayOfWeek: 1 });
timetableEntrySchema.index({ tenantId: 1, sectionId: 1, dayOfWeek: 1 });
timetableEntrySchema.index({ tenantId: 1, roomId: 1, dayOfWeek: 1 });

roomSchema.index({ tenantId: 1, code: 1 }, { unique: true });
roomSchema.index({ tenantId: 1, type: 1, isActive: 1 });

timeSlotSchema.index({ tenantId: 1, dayOfWeek: 1 });
timeSlotSchema.index({ tenantId: 1, isActive: 1 });

export const Timetable = mongoose.model<ITimetable>('Timetable', timetableSchema);
export const TimetableEntry = mongoose.model<ITimetableEntry>('TimetableEntry', timetableEntrySchema);
export const Room = mongoose.model<IRoom>('Room', roomSchema);
export const TimeSlot = mongoose.model<ITimeSlot>('TimeSlot', timeSlotSchema);