import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  tenantId: string;
  userId: string;
  admissionNo: string;
  rollNo: string; // Unique roll number per tenant
  firstName: string;
  lastName: string;
  grade: string;
  section?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  guardians: {
    userId?: string;
    name: string;
    phone?: string;
    email?: string;
    relationship: string;
    isVerified: boolean;
    verificationCode?: string;
  }[];
  address?: string;
  enrollments: {
    academicYearId: string;
    sectionId: string;
    rollNo?: string;
  }[];
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
}

const studentSchema = new Schema<IStudent>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    admissionNo: {
      type: String,
      required: true,
      unique: true,
    },
    rollNo: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    grade: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    guardians: [{
      userId: {
        type: String,
        index: true,
      },
      name: {
        type: String,
        required: true,
      },
      phone: String,
      email: String,
      relationship: {
        type: String,
        required: true,
        enum: ['father', 'mother', 'guardian', 'grandfather', 'grandmother', 'uncle', 'aunt', 'other'],
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
      verificationCode: String,
    }],
    address: {
      type: String,
      trim: true,
    },
    enrollments: [{
      academicYearId: {
        type: String,
        required: true,
      },
      sectionId: {
        type: String,
        required: true,
      },
      rollNo: String,
    }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'graduated', 'transferred'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
studentSchema.index({ tenantId: 1, rollNo: 1 });
studentSchema.index({ tenantId: 1, admissionNo: 1 });
studentSchema.index({ tenantId: 1, userId: 1 });
studentSchema.index({ 'guardians.userId': 1 });
studentSchema.index({ 'guardians.verificationCode': 1 });

export const Student = mongoose.model<IStudent>('Student', studentSchema);