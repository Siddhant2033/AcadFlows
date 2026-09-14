import mongoose, { Schema, Document } from 'mongoose';

export type StudentStatus =
  | 'pending'      // Registered, waiting for class-teacher approval
  | 'active'       // Approved
  | 'suspended'    // Temporarily disabled
  | 'rejected'     // Rejected
  | 'inactive'     // Legacy
  | 'graduated'    // Graduated
  | 'transferred'  // Transferred to another school
  | 'withdrawn';   // Withdrawn

export interface IStudent extends Document {
  tenantId: string;
  userId: string;
  admissionNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  grade: string;
  section?: string;
  sectionId?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  nationality?: string;
  religion?: string;
  motherTongue?: string;
  guardians: {
    userId?: string;
    name: string;
    phone: string;
    email?: string;
    relationship: 'father' | 'mother' | 'guardian' | 'grandfather' | 'grandmother' | 'uncle' | 'aunt' | 'other';
    occupation?: string;
    isVerified: boolean;
    verificationCode?: string;
  }[];
  address: {
    street?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  previousSchool?: {
    name: string;
    address?: string;
    year?: string;
    reason?: string;
  };
  medicalInfo?: {
    allergies?: string[];
    medicalConditions?: string[];
    medications?: string[];
    emergencyNotes?: string;
  };
  documents: {
    type: 'birthCertificate' | 'transferCertificate' | 'medicalReport' | 'idProof' | 'addressProof' | 'other';
    name: string;
    url: string;
    uploadedAt: Date;
    size?: number;
    mimeType?: string;
  }[];
  enrollments: {
    academicYearId: string;
    sectionId: string;
    rollNo?: string;
    enrollmentDate: Date;
    status: 'active' | 'completed' | 'withdrawn' | 'transferred';
    withdrawalDate?: Date;
    withdrawalReason?: string;
  }[];
  status: StudentStatus;

  // ─── Approval workflow ───
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  suspendedAt?: Date;
  suspendedReason?: string;

  // ─── Escalation ───
  approvalDueBy?: Date;
  escalatedAt?: Date;
  escalationLevel?: number;

  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
    },
    admissionNo: {
      type: String,
      required: true,
    },
    rollNo: {
      type: String,
      required: true,
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
    middleName: {
      type: String,
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
    sectionId: {
      type: String,
      index: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    nationality: String,
    religion: String,
    motherTongue: String,
    guardians: [
      {
        userId: String,
        name: {
          type: String,
          required: true,
        },
        phone: {
          type: String,
          required: true,
        },
        email: String,
        relationship: {
          type: String,
          required: true,
          enum: ['father', 'mother', 'guardian', 'grandfather', 'grandmother', 'uncle', 'aunt', 'other'],
        },
        occupation: String,
        isVerified: {
          type: Boolean,
          default: false,
        },
        verificationCode: String,
      },
    ],
    address: {
      street: String,
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
        default: 'India',
      },
      postalCode: {
        type: String,
        required: true,
      },
    },
    emergencyContact: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      relationship: {
        type: String,
        required: true,
      },
    },
    previousSchool: {
      name: String,
      address: String,
      year: String,
      reason: String,
    },
    medicalInfo: {
      allergies: [String],
      medicalConditions: [String],
      medications: [String],
      emergencyNotes: String,
    },
    documents: [
      {
        type: {
          type: String,
          enum: ['birthCertificate', 'transferCertificate', 'medicalReport', 'idProof', 'addressProof', 'other'],
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        size: Number,
        mimeType: String,
      },
    ],
    enrollments: [
      {
        academicYearId: {
          type: String,
          required: true,
        },
        sectionId: {
          type: String,
          required: true,
        },
        rollNo: String,
        enrollmentDate: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['active', 'completed', 'withdrawn', 'transferred'],
          default: 'active',
        },
        withdrawalDate: Date,
        withdrawalReason: String,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'rejected', 'inactive', 'graduated', 'transferred', 'withdrawn'],
      default: 'pending',
      index: true,
    },

    // Approval workflow
    approvedBy: String,
    approvedAt: Date,
    rejectedBy: String,
    rejectedAt: Date,
    rejectionReason: String,
    suspendedAt: Date,
    suspendedReason: String,

    // Escalation
    approvalDueBy: Date,
    escalatedAt: Date,
    escalationLevel: { type: Number, default: 0 },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  },
);

// Indexes
studentSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
studentSchema.index({ tenantId: 1, admissionNo: 1 }, { unique: true });
studentSchema.index({ tenantId: 1, rollNo: 1 }, { unique: true });
studentSchema.index({ tenantId: 1, grade: 1 });
studentSchema.index({ tenantId: 1, status: 1 });
studentSchema.index({ 'guardians.userId': 1 });
studentSchema.index({ 'guardians.verificationCode': 1 });
// Approval inbox query — pending students newest first
studentSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
// Section-based pending query
studentSchema.index({ tenantId: 1, sectionId: 1, status: 1 });

export const Student = mongoose.model<IStudent>('Student', studentSchema);