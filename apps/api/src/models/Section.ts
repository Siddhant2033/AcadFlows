import mongoose, { Schema, Document } from 'mongoose';

export interface ISection extends Document {
  tenantId: string;
  gradeId: string;
  name: string;
  code: string;
  capacity: number;
  /** The class teacher for this section. Only one per section. */
  classTeacherId?: string;
  roomNumber?: string;
  status: 'active' | 'inactive';
}

const sectionSchema = new Schema<ISection>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    gradeId: {
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
    capacity: {
      type: Number,
      required: true,
      default: 30,
    },
    classTeacherId: {
      type: String,
      index: true,
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
  },
);

sectionSchema.index({ tenantId: 1, code: 1 }, { unique: true });
sectionSchema.index({ tenantId: 1, gradeId: 1 });
// One teacher can be class teacher of only one section per tenant.
// Partial index so multiple sections can have no class teacher assigned.
sectionSchema.index(
  { tenantId: 1, classTeacherId: 1 },
  {
    unique: true,
    partialFilterExpression: { classTeacherId: { $type: 'string' } },
  },
);

export const Section = mongoose.model<ISection>('Section', sectionSchema);