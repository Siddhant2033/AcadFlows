import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacher extends Document {
  tenantId: string;
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  nationality?: string;
  religion?: string;
  phone: string;
  email: string;
  alternativeEmail?: string;
  address: {
    street?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  qualifications: {
    degree: string;
    institution: string;
    year: number;
    specialization?: string;
    grade?: string;
  }[];
  experience: {
    institution: string;
    position: string;
    fromDate: Date;
    toDate?: Date;
    isCurrent: boolean;
    responsibilities?: string;
  }[];
  subjects: string[]; // Subject IDs
  assignedSections: {
    sectionId: string;
    academicYearId: string;
    subjectId: string;
    isPrimary: boolean;
  }[];
  specialization: string[];
  joiningDate: Date;
  employmentType: 'permanent' | 'contract' | 'temporary' | 'probation';
  contractEndDate?: Date;
  salary?: {
    amount: number;
    currency: string;
    frequency: 'monthly' | 'weekly' | 'hourly';
  };
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branchName: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  documents: {
    type: 'resume' | 'certificate' | 'idProof' | 'addressProof' | 'photo' | 'contract' | 'other';
    name: string;
    url: string;
    uploadedAt: Date;
    size?: number;
    mimeType?: string;
  }[];
  leaveBalance: {
    annual: number;
    sick: number;
    casual: number;
    other: number;
  };
  status: 'active' | 'inactive' | 'on_leave' | 'resigned' | 'terminated';
  isDeleted: boolean;
  deletedAt?: Date;
}

const teacherSchema = new Schema<ITeacher>(
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
    employeeId: {
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
    middleName: {
      type: String,
      trim: true,
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
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed'],
    },
    nationality: String,
    religion: String,
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    alternativeEmail: String,
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
    qualifications: [{
      degree: {
        type: String,
        required: true,
      },
      institution: {
        type: String,
        required: true,
      },
      year: {
        type: Number,
        required: true,
      },
      specialization: String,
      grade: String,
    }],
    experience: [{
      institution: {
        type: String,
        required: true,
      },
      position: {
        type: String,
        required: true,
      },
      fromDate: {
        type: Date,
        required: true,
      },
      toDate: Date,
      isCurrent: {
        type: Boolean,
        default: false,
      },
      responsibilities: String,
    }],
    subjects: [String],
    assignedSections: [{
      sectionId: {
        type: String,
        required: true,
      },
      academicYearId: {
        type: String,
        required: true,
      },
      subjectId: {
        type: String,
        required: true,
      },
      isPrimary: {
        type: Boolean,
        default: false,
      },
    }],
    specialization: [String],
    joiningDate: {
      type: Date,
      required: true,
    },
    employmentType: {
      type: String,
      enum: ['permanent', 'contract', 'temporary', 'probation'],
      default: 'permanent',
    },
    contractEndDate: Date,
    salary: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD',
      },
      frequency: {
        type: String,
        enum: ['monthly', 'weekly', 'hourly'],
        default: 'monthly',
      },
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      branchName: String,
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
    documents: [{
      type: {
        type: String,
        enum: ['resume', 'certificate', 'idProof', 'addressProof', 'photo', 'contract', 'other'],
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
    }],
    leaveBalance: {
      annual: {
        type: Number,
        default: 20,
      },
      sick: {
        type: Number,
        default: 10,
      },
      casual: {
        type: Number,
        default: 12,
      },
      other: {
        type: Number,
        default: 5,
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave', 'resigned', 'terminated'],
      default: 'active',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
teacherSchema.index({ tenantId: 1, employeeId: 1 }, { unique: true });
teacherSchema.index({ tenantId: 1, userId: 1 });
teacherSchema.index({ tenantId: 1, status: 1 });
teacherSchema.index({ tenantId: 1, subjects: 1 });

export const Teacher = mongoose.model<ITeacher>('Teacher', teacherSchema);