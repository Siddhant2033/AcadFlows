import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacherSubject extends Document {
  tenantId: string;
  teacherId: string;
  subjectId: string;
  gradeId?: string;
  sectionId?: string;
  academicYearId: string;
  status: 'active' | 'inactive';
}

const teacherSubjectSchema = new Schema<ITeacherSubject>(
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
    subjectId: {
      type: String,
      required: true,
      index: true,
    },
    gradeId: {
      type: String,
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
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

teacherSubjectSchema.index({ tenantId: 1, teacherId: 1, subjectId: 1 });
teacherSubjectSchema.index({ tenantId: 1, academicYearId: 1 });

export const TeacherSubject = mongoose.model<ITeacherSubject>('TeacherSubject', teacherSubjectSchema);