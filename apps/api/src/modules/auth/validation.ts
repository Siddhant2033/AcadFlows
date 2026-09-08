import { z } from 'zod';

// Custom validator for MongoDB ObjectId
const objectIdSchema = z.string().refine(
  (val) => /^[0-9a-fA-F]{24}$/.test(val),
  { message: 'Invalid ObjectId format. Must be a 24-character hex string.' }
);

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'teacher', 'student', 'guardian']),
  tenantId: objectIdSchema,
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});