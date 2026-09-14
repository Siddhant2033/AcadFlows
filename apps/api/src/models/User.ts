import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserStatus =
  | 'pending'      // Registered, waiting for approval
  | 'active'       // Approved
  | 'suspended'    // Temporarily disabled
  | 'rejected'     // Rejected
  | 'inactive'     // Legacy
  | 'archived';    // Legacy

export interface IUser extends Document {
  tenantId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'student' | 'guardian';
  status: UserStatus;

  // Approval workflow
  approvedBy?: string;         // userId of the approver
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  suspendedAt?: Date;
  suspendedReason?: string;

  // Escalation
  approvalDueBy?: Date;
  escalatedAt?: Date;
  escalationLevel?: number;    // 0 = not escalated, 1 = admin notified, 2 = platform admin notified

  // Identity verification
  verificationMethod?: 'email' | 'roll_number' | 'admin_invite' | 'domain';
  verificationData?: Record<string, any>;

  profilePicture?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  bio?: string;
  lastLoginAt?: Date;
  emailVerified: boolean;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    tenantId: { type: String, required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    role: {
      type: String,
      enum: ['admin', 'teacher', 'student', 'guardian'],
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'rejected', 'inactive', 'archived'],
      default: 'pending',
      index: true,
    },

    // Approval metadata
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

    // Verification
    verificationMethod: {
      type: String,
      enum: ['email', 'roll_number', 'admin_invite', 'domain'],
    },
    verificationData: { type: Schema.Types.Mixed },

    profilePicture: { type: String, default: '' },
    phone: { type: String, trim: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    address: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 500 },
    lastLoginAt: Date,
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ tenantId: 1, status: 1 });
// Compound index for admin approval inbox
userSchema.index({ tenantId: 1, role: 1, status: 1, createdAt: -1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', userSchema);