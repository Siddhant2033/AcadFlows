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
  .max(100, 'Password cannot exceed 100 characters')
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
 * Status enum validation
 */
const statusSchema = z.enum(['active', 'inactive', 'archived'], {
  errorMap: () => ({ message: 'Status must be active, inactive, or archived' }),
});

// ==================== AUTH SCHEMAS ====================

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
 * Forgot password schema
 * Validates email for password reset request
 */
export const forgotPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
}).strict();

/**
 * Reset password schema
 * Validates token, password, and confirmation
 */
export const resetPasswordSchema = z.object({
  token: z.string()
    .min(32, 'Invalid reset token')
    .max(64, 'Invalid reset token'),
  
  password: passwordSchema,
  
  confirmPassword: z.string(),
}).strict().refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Change password schema
 * Validates current password, new password, and confirmation
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

// ==================== USER MANAGEMENT SCHEMAS ====================

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
  
  status: statusSchema.optional(),
}).strict();

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

// ==================== TENANT SCHEMAS ====================

/**
 * Create tenant schema
 */
export const createTenantSchema = z.object({
  name: z.string()
    .min(1, 'Tenant name is required')
    .max(100, 'Tenant name cannot exceed 100 characters'),
  
  slug: z.string()
    .min(1, 'Slug is required')
    .max(50, 'Slug cannot exceed 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  
  address: z.string()
    .max(200, 'Address cannot exceed 200 characters')
    .optional(),
  
  phone: z.string()
    .max(20, 'Phone cannot exceed 20 characters')
    .optional(),
  
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email cannot exceed 100 characters')
    .toLowerCase()
    .trim()
    .optional(),
  
  logoUrl: z.string()
    .url('Invalid URL format')
    .optional(),
  
  settings: z.object({
    domain: z.string().optional(),
    academicYearStart: z.string().optional(),
    academicYearEnd: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
    language: z.string().optional(),
    emailDomain: z.string().optional(),
  }).optional(),
}).strict();

/**
 * Update tenant schema
 */
export const updateTenantSchema = z.object({
  name: z.string()
    .min(1, 'Tenant name is required')
    .max(100, 'Tenant name cannot exceed 100 characters')
    .optional(),
  
  slug: z.string()
    .min(1, 'Slug is required')
    .max(50, 'Slug cannot exceed 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  
  address: z.string()
    .max(200, 'Address cannot exceed 200 characters')
    .optional(),
  
  phone: z.string()
    .max(20, 'Phone cannot exceed 20 characters')
    .optional(),
  
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email cannot exceed 100 characters')
    .toLowerCase()
    .trim()
    .optional(),
  
  logoUrl: z.string()
    .url('Invalid URL format')
    .optional(),
  
  status: statusSchema.optional(),
  
  settings: z.object({
    domain: z.string().optional(),
    academicYearStart: z.string().optional(),
    academicYearEnd: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
    language: z.string().optional(),
    emailDomain: z.string().optional(),
  }).optional(),
}).strict();

/**
 * List tenants schema
 */
export const listTenantsSchema = z.object({
  limit: z.coerce.number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional(),
  
  offset: z.coerce.number()
    .min(0, 'Offset must be at least 0')
    .optional(),
  
  status: statusSchema.optional(),
  
  search: z.string()
    .max(100, 'Search query cannot exceed 100 characters')
    .optional(),
}).strict();

/**
 * Validate school code schema
 */
export const validateSchoolCodeSchema = z.object({
  schoolCode: z.string()
    .min(1, 'School code is required')
    .max(20, 'School code cannot exceed 20 characters')
    .regex(/^[A-Z0-9\-]+$/, 'School code can only contain letters, numbers, and hyphens'),
}).strict();

/**
 * Create school schema (for admin registration)
 */
export const createSchoolSchema = z.object({
  name: z.string()
    .min(1, 'School name is required')
    .max(100, 'School name cannot exceed 100 characters'),
  
  slug: z.string()
    .min(1, 'Slug is required')
    .max(50, 'Slug cannot exceed 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  
  address: z.string()
    .max(200, 'Address cannot exceed 200 characters')
    .optional(),
  
  phone: z.string()
    .max(20, 'Phone cannot exceed 20 characters')
    .optional(),
  
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email cannot exceed 100 characters')
    .toLowerCase()
    .trim()
    .optional(),
}).strict();

// ==================== UTILITY FUNCTIONS ====================

/**
 * Export individual validators for use in other modules
 */
export const validators = {
  objectId: objectIdSchema,
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
  name: nameSchema,
  role: roleSchema,
  status: statusSchema,
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
 * Returns an object with field names as keys and error messages as values
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (path) {
      errors[path] = err.message;
    } else {
      errors._global = err.message;
    }
  });
  return errors;
}

/**
 * Get all validation errors as a single string
 */
export function getZodErrorMessages(error: z.ZodError): string {
  const errors = formatZodErrors(error);
  return Object.values(errors).join(', ');
}

/**
 * Check if a value is valid against a schema without throwing
 */
export function isValid<T>(schema: z.ZodSchema<T>, data: unknown): boolean {
  try {
    schema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize input to prevent common injection attacks
 * For MVP, this is a basic sanitizer
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email domain against allowed domains (optional)
 */
export function validateEmailDomain(email: string, allowedDomains: string[]): boolean {
  if (!email || !allowedDomains || allowedDomains.length === 0) return true;
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  return allowedDomains.some(d => domain === d.toLowerCase() || domain.endsWith(`.${d.toLowerCase()}`));
}

// ==================== SCHEMA TYPE INFERENCE ====================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type ValidateSchoolCodeInput = z.infer<typeof validateSchoolCodeSchema>;