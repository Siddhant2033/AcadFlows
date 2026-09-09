import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  tenantId: string;
  academicYearId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  type: 'homework' | 'classwork' | 'project' | 'quiz' | 'test' | 'exam';
  maxScore: number;
  weightage: number;
  dueDate: Date;
  assignedDate: Date;
  instructions?: string;
  attachments?: {
    name: string;
    url: string;
    size?: number;
  }[];
  isPublished: boolean;
  publishedAt?: Date;
  status: 'draft' | 'published' | 'closed' | 'archived';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubmission extends Document {
  tenantId: string;
  assignmentId: string;
  studentId: string;
  submittedAt: Date;
  content?: string;
  attachments?: {
    name: string;
    url: string;
    size?: number;
  }[];
  isLate: boolean;
  score?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: Date;
  status: 'pending' | 'submitted' | 'graded' | 'returned';
  createdAt: Date;
  updatedAt: Date;
}

export interface IGradebook extends Document {
  tenantId: string;
  studentId: string;
  academicYearId: string;
  subjectId: string;
  assignments: {
    assignmentId: string;
    score: number;
    maxScore: number;
    weightage: number;
    submittedAt: Date;
  }[];
  totalScore: number;
  averageScore: number;
  grade: string;
  gradePoint: number;
  remarks?: string;
  updatedAt: Date;
}

export interface IReportCard extends Document {
  tenantId: string;
  studentId: string;
  academicYearId: string;
  term: 'first' | 'second' | 'third' | 'final';
  subjects: {
    subjectId: string;
    name: string;
    score: number;
    grade: string;
    gradePoint: number;
    remarks?: string;
  }[];
  totalScore: number;
  averageScore: number;
  grade: string;
  gradePoint: number;
  attendance: number;
  conduct?: string;
  remarks?: string;
  generatedAt: Date;
  createdBy: string;
  status: 'draft' | 'published' | 'archived';
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Assignment Schema
const assignmentSchema = new Schema<IAssignment>(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['homework', 'classwork', 'project', 'quiz', 'test', 'exam'],
      required: true,
    },
    maxScore: {
      type: Number,
      required: true,
      min: 0,
    },
    weightage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },
    instructions: String,
    attachments: [{
      name: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      size: Number,
    }],
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: Date,
    status: {
      type: String,
      enum: ['draft', 'published', 'closed', 'archived'],
      default: 'draft',
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

// Submission Schema
const submissionSchema = new Schema<ISubmission>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    assignmentId: {
      type: String,
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    content: String,
    attachments: [{
      name: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      size: Number,
    }],
    isLate: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      min: 0,
    },
    feedback: String,
    gradedBy: String,
    gradedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'submitted', 'graded', 'returned'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Gradebook Schema
const gradebookSchema = new Schema<IGradebook>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    academicYearId: {
      type: String,
      required: true,
      index: true,
    },
    subjectId: {
      type: String,
      required: true,
      index: true,
    },
    assignments: [{
      assignmentId: {
        type: String,
        required: true,
      },
      score: {
        type: Number,
        required: true,
        min: 0,
      },
      maxScore: {
        type: Number,
        required: true,
        min: 0,
      },
      weightage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      submittedAt: Date,
    }],
    totalScore: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    grade: {
      type: String,
    },
    gradePoint: {
      type: Number,
      default: 0,
    },
    remarks: String,
  },
  {
    timestamps: true,
  }
);

// Report Card Schema
const reportCardSchema = new Schema<IReportCard>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    academicYearId: {
      type: String,
      required: true,
      index: true,
    },
    term: {
      type: String,
      enum: ['first', 'second', 'third', 'final'],
      required: true,
    },
    subjects: [{
      subjectId: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      score: {
        type: Number,
        required: true,
        min: 0,
      },
      grade: {
        type: String,
        required: true,
      },
      gradePoint: {
        type: Number,
        required: true,
      },
      remarks: String,
    }],
    totalScore: {
      type: Number,
      required: true,
    },
    averageScore: {
      type: Number,
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    gradePoint: {
      type: Number,
      required: true,
    },
    attendance: {
      type: Number,
      default: 0,
    },
    conduct: String,
    remarks: String,
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    pdfUrl: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
assignmentSchema.index({ tenantId: 1, sectionId: 1, status: 1 });
assignmentSchema.index({ tenantId: 1, teacherId: 1, dueDate: 1 });
assignmentSchema.index({ tenantId: 1, subjectId: 1, academicYearId: 1 });

submissionSchema.index({ tenantId: 1, assignmentId: 1, studentId: 1 }, { unique: true });
submissionSchema.index({ tenantId: 1, studentId: 1, status: 1 });
submissionSchema.index({ tenantId: 1, assignmentId: 1, status: 1 });

gradebookSchema.index({ tenantId: 1, studentId: 1, academicYearId: 1 });
gradebookSchema.index({ tenantId: 1, studentId: 1, subjectId: 1 }, { unique: true });

reportCardSchema.index({ tenantId: 1, studentId: 1, academicYearId: 1, term: 1 }, { unique: true });
reportCardSchema.index({ tenantId: 1, academicYearId: 1, status: 1 });

export const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema);
export const Submission = mongoose.model<ISubmission>('Submission', submissionSchema);
export const Gradebook = mongoose.model<IGradebook>('Gradebook', gradebookSchema);
export const ReportCard = mongoose.model<IReportCard>('ReportCard', reportCardSchema);