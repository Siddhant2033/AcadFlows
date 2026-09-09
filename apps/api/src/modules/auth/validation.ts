import { z } from 'zod';

/**
 * Custom validator for MongoDB ObjectId
 * Must be a 24-character hex string
 */
const objectIdSchema = z.string()
  .length(24, 'ObjectId must be exactly 24 characters')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format. Must be a 24-character hex string.');

/**
 * Custom validator for password
 * At least 8 characters, must contain at least one uppercase letter,
 * one lowercase letter, one number, and one special character
 */
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Custom validator for name
 * Must not be empty and only contain letters, spaces, hyphens, and apostrophes
 */
const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(50, 'Name cannot exceed 50 characters')
  .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

/**
 * Role enum validation
 */
const roleSchema = z.enum(['admin', 'teacher', 'student', 'guardian'], {
  errorMap: () => ({ message: 'Role must be admin, teacher, student, or guardian' }),
});

/**
 * Register schema
 * Validates all fields for user registration
 */
export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email cannot exceed 100 characters')
    .toLowerCase()
    .trim(),
  
  password: passwordSchema,
  
  firstName: nameSchema,
  
  lastName: nameSchema,
  
  role: roleSchema,
  
  tenantId: objectIdSchema,
}).strict(); // Prevents extra fields

/**
 * Login schema
 * Validates email and password for login
 */
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  
  password: z.string()
    .min(1, 'Password is required'),
}).strict();

/**
 * Refresh token schema
 * Validates refresh token
 */
export const refreshSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token is required'),
}).strict();

/**
 * Update user schema
 * Validates fields for updating a user
 */
export const updateUserSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email cannot exceed 100 characters')
    .toLowerCase()
    .trim()
    .optional(),
  
  password: passwordSchema.optional(),
  
  firstName: nameSchema.optional(),
  
  lastName: nameSchema.optional(),
  
  role: roleSchema.optional(),
  
  status: z.enum(['active', 'inactive', 'archived']).optional(),
}).strict();

/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
}).strict();

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).strict().refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  
  newPassword: passwordSchema,
  
  confirmPassword: z.string(),
}).strict().refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Bulk registration schema (for importing users)
 */
export const bulkRegisterSchema = z.array(
  z.object({
    email: z.string().email('Invalid email format'),
    password: passwordSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    role: roleSchema,
  })
).min(1, 'At least one user is required');

/**
 * Validation helper functions
 */

// Export individual validators for use in other modules
export const validators = {
  objectId: objectIdSchema,
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
  name: nameSchema,
  role: roleSchema,
};

/**
 * Utility to validate and parse request data
 * Returns validated data or throws error
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Utility to safely validate without throwing
 * Returns { success: boolean, data?: T, error?: string }
 */
export function validateSafe<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: string;
} {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * Format Zod errors for display
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  return errors;
}