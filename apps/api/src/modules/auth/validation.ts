import { z } from 'zod';

const objectIdSchema = z
  .string()
  .length(24, 'ObjectId must be exactly 24 characters')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format.');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password cannot exceed 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name cannot exceed 50 characters')
  .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

const roleSchema = z.enum(['admin', 'teacher', 'student', 'guardian'], {
  errorMap: () => ({ message: 'Role must be admin, teacher, student, or guardian' }),
});

const statusSchema = z.enum(['active', 'inactive', 'archived'], {
  errorMap: () => ({ message: 'Status must be active, inactive, or archived' }),
});

const relationshipEnum = z.enum([
  'father',
  'mother',
  'guardian',
  'grandfather',
  'grandmother',
  'uncle',
  'aunt',
  'other',
]);

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional().default('India'),
  postalCode: z.string().optional(),
});

const childLinkSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().optional(),
  grade: z.string().optional(),
  rollNo: z.string().optional(),
});

// ─── Auth Schemas ─────────────────────────────────────────

export const registerSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email format')
      .max(100, 'Email cannot exceed 100 characters')
      .toLowerCase()
      .trim(),

    password: passwordSchema,

    firstName: nameSchema,
    lastName: nameSchema,
    role: roleSchema,
    tenantId: objectIdSchema,

    // ── Shared optional ──
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),

    // ── Student ──
    // grade + sectionId are conditionally required when the student
    // did NOT come in via /students/verify-identity. Enforced below
    // with `.superRefine()`.
    grade: z.string().optional(),
    section: z.string().optional(),
    sectionId: z.string().optional(),
    address: addressSchema.optional(),
    parentName: z.string().optional(),
    parentPhone: z.string().optional(),
    parentEmail: z.string().optional(),

    // ── Student verification (Sprint 5) ──
    verifiedStudentId: z.string().optional(),
    verificationData: z
      .object({
        studentId: z.string().optional(),
      })
      .optional(),

    // ── Teacher ──
    employeeId: z.string().optional(),
    subject: z.string().optional(),
    qualification: z.string().optional(),
    experience: z.union([z.string(), z.number()]).optional(),
    joiningDate: z.string().optional(),

    // ── Guardian ──
    relationship: relationshipEnum.optional(),
    occupation: z.string().optional(),
    children: z.array(childLinkSchema).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Students who did NOT pass verification must supply grade +
    // sectionId so the approver knows which section to review.
    if (data.role !== 'student') return;

    const hasVerifiedId =
      !!data.verifiedStudentId || !!data.verificationData?.studentId;

    if (hasVerifiedId) return;

    if (!data.grade || data.grade.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['grade'],
        message:
          'Grade is required when you do not have a verified student record',
      });
    }

    if (!data.sectionId || data.sectionId.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sectionId'],
        message:
          'Section is required when you do not have a verified student record',
      });
    }
  });

export const loginSchema = z
  .object({
    email: z.string().email('Invalid email format').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: z.string().email('Invalid email format').toLowerCase().trim(),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(32).max(64),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ─── User Management ──────────────────────────────────────

export const updateUserSchema = z
  .object({
    email: z.string().email().max(100).toLowerCase().trim().optional(),
    password: passwordSchema.optional(),
    firstName: nameSchema.optional(),
    lastName: nameSchema.optional(),
    role: roleSchema.optional(),
    status: statusSchema.optional(),
  })
  .strict();

export const bulkRegisterSchema = z
  .array(
    z.object({
      email: z.string().email('Invalid email format'),
      password: passwordSchema,
      firstName: nameSchema,
      lastName: nameSchema,
      role: roleSchema,
    }),
  )
  .min(1, 'At least one user is required');

// ─── Tenant Schemas ───────────────────────────────────────

export const createTenantSchema = z
  .object({
    name: z.string().min(1).max(100),
    slug: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[a-z0-9-]+$/),
    address: z.string().max(200).optional(),
    phone: z.string().max(20).optional(),
    email: z.string().email().max(100).toLowerCase().trim().optional(),
    logoUrl: z.string().url().optional(),
    settings: z
      .object({
        domain: z.string().optional(),
        academicYearStart: z.string().optional(),
        academicYearEnd: z.string().optional(),
        timezone: z.string().optional(),
        currency: z.string().optional(),
        language: z.string().optional(),
        emailDomain: z.string().optional(),
      })
      .optional(),
  })
  .strict();

export const updateTenantSchema = createTenantSchema.partial().extend({
  status: statusSchema.optional(),
});

export const listTenantsSchema = z
  .object({
    limit: z.coerce.number().min(1).max(100).optional(),
    offset: z.coerce.number().min(0).optional(),
    status: statusSchema.optional(),
    search: z.string().max(100).optional(),
  })
  .strict();

export const validateSchoolCodeSchema = z
  .object({
    schoolCode: z
      .string()
      .min(1)
      .max(20)
      .regex(/^[A-Z0-9\-]+$/),
  })
  .strict();

export const createSchoolSchema = z
  .object({
    name: z.string().min(1).max(100),
    slug: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    address: z.string().max(200).optional(),
    phone: z.string().max(20).optional(),
    email: z.string().email().max(100).toLowerCase().trim().optional(),
  })
  .strict();

// ─── Utilities ─────────────────────────────────────────────

export const validators = {
  objectId: objectIdSchema,
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
  name: nameSchema,
  role: roleSchema,
  status: statusSchema,
  relationship: relationshipEnum,
};

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach(err => {
    const path = err.path.join('.');
    if (path) errors[path] = err.message;
    else errors._global = err.message;
  });
  return errors;
}

export function getZodErrorMessages(error: z.ZodError): string {
  return Object.values(formatZodErrors(error)).join(', ');
}

export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

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