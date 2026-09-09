import mongoose, { Schema, Document } from 'mongoose';

export interface ILeave extends Document {
  tenantId: string;
  teacherId: string;
  type: 'annual' | 'sick' | 'casual' | 'other';
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  attachment?: string;
  isHalfDay: boolean;
}

const leaveSchema = new Schema<ILeave>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    teacherId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['annual', 'sick', 'casual', 'other'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    approvedBy: String,
    approvedAt: Date,
    rejectionReason: String,
    attachment: String,
    isHalfDay: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
leaveSchema.index({ tenantId: 1, teacherId: 1, status: 1 });
leaveSchema.index({ tenantId: 1, startDate: 1, endDate: 1 });

export const Leave = mongoose.model<ILeave>('Leave', leaveSchema);