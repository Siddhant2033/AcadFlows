import mongoose, { Schema, Document } from 'mongoose';

export interface IPasswordResetToken extends Document {
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      // TTL index: MongoDB auto-deletes expired documents
      index: { expires: 0 },
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const PasswordResetToken = mongoose.model<IPasswordResetToken>(
  'PasswordResetToken',
  passwordResetTokenSchema,
);