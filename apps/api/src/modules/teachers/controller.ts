import { Request, Response, NextFunction } from 'express';
import { TeacherService, LeaveService } from './service';
import { Teacher } from '../../models/Teacher';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';

// ─────────────────────────────────────────────────────────────
// Reusable sub-schemas
// ─────────────────────────────────────────────────────────────

const addressSchema = z.object({
  street: z.string().optional().default(''),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().optional().default('India'),
  postalCode: z.string().min(1, 'Postal code is required'),
});

const qualificationSchema = z.object({
  degree: z.string().min(1, 'Degree is required'),
  institution: z.string().min(1, 'Institution is required'),
  year: z.coerce.number().min(1900, 'Year must be after 1900'),
  specialization: z.string().optional().default(''),
  grade: z.string().optional().default(''),
});

const experienceSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  position: z.string().min(1, 'Position is required'),
  fromDate: z.coerce.date(),
  toDate: z.coerce.date().optional(),
  isCurrent: z.boolean().optional().default(false),
  responsibilities: z.string().optional().default(''),
});

const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Emergency contact name is required'),
  phone: z.string().min(1, 'Emergency contact phone is required'),
  relationship: z.string().min(1, 'Relationship is required'),
});

const optionalEmail = z
  .union([z.string(), z.undefined(), z.null()])
  .optional()
  .transform(v => {
    if (v === undefined || v === null) return undefined;
    const trimmed = String(v).trim();
    return trimmed === '' ? undefined : trimmed;
  })
  .refine(v => v === undefined || /^\S+@\S+\.\S+$/.test(v), {
    message: 'Invalid email address',
  });

const optionalString = z
  .union([z.string(), z.undefined(), z.null()])
  .optional()
  .transform(v => {
    if (v === undefined || v === null) return undefined;
    const trimmed = String(v).trim();
    return trimmed === '' ? undefined : trimmed;
  });

// ─────────────────────────────────────────────────────────────
// Teacher schema
// ─────────────────────────────────────────────────────────────

export const createTeacherSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    middleName: optionalString,
    email: z.string().email('Invalid email address'),
    password: z
      .union([z.string(), z.undefined(), z.null()])
      .optional()
      .transform(v => {
        if (v === undefined || v === null) return undefined;
        const s = String(v);
        return s === '' ? undefined : s;
      })
      .refine(v => v === undefined || v.length >= 8, {
        message: 'Password must be at least 8 characters',
      }),

    dateOfBirth: z.coerce.date(),
    gender: z.enum(['male', 'female', 'other']),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
    nationality: optionalString,
    religion: optionalString,

    phone: z.string().min(1, 'Phone number is required'),
    alternativeEmail: optionalEmail,

    address: addressSchema,

    qualifications: z.array(qualificationSchema).optional().default([]),
    experience: z.array(experienceSchema).optional().default([]),
    subjects: z.array(z.string()).optional().default([]),
    specialization: z.array(z.string()).optional().default([]),

    joiningDate: z.coerce.date(),
    employmentType: z
      .enum(['permanent', 'contract', 'temporary', 'probation'])
      .optional()
      .default('permanent'),
    contractEndDate: z.coerce.date().optional(),

    salary: z
      .object({
        amount: z.coerce.number().min(0).optional().default(0),
        currency: z.string().optional().default('INR'),
        frequency: z.enum(['monthly', 'weekly', 'hourly']).optional().default('monthly'),
      })
      .optional(),

    bankDetails: z
      .object({
        bankName: z.string().optional().default(''),
        accountNumber: z.string().optional().default(''),
        ifscCode: z.string().optional().default(''),
        branchName: z.string().optional().default(''),
      })
      .optional(),

    emergencyContact: emergencyContactSchema,
  })
  .strict();

export const updateTeacherSchema = createTeacherSchema.partial();

const createLeaveSchema = z.object({
  type: z.enum(['annual', 'sick', 'casual', 'other']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().min(1, 'Reason is required'),
  isHalfDay: z.boolean().optional().default(false),
  attachment: z.string().optional(),
});

const updateLeaveStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
});

// ─────────────────────────────────────────────────────────────
// Teacher Controller
// ─────────────────────────────────────────────────────────────

export class TeacherController {
  static async getCurrentTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const teacher = await Teacher.findOne({
        userId: authReq.user.id,
        tenantId: authReq.user.tenantId,
        isDeleted: false,
      }).populate('userId', 'email phone profilePicture');

      if (!teacher) {
        return res.status(404).json({
          success: false,
          error: 'Teacher profile not found for this user',
        });
      }

      res.json({ success: true, data: teacher });
    } catch (error) {
      next(error);
    }
  }

  static async createTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = createTeacherSchema.parse(req.body);

      const result = await TeacherService.createTeacher({
        ...validated,
        tenantId: authReq.user.tenantId,
      });

      res.status(201).json({
        success: true,
        data: result.teacher,
        ...(result.tempPassword && {
          message: `Teacher created successfully! Temporary password: ${result.tempPassword}`,
          meta: { tempPassword: result.tempPassword },
        }),
        ...(!result.tempPassword && {
          message: 'Teacher created successfully!',
        }),
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeachers(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { status, subject, employmentType, search, page, limit } = req.query;

      const result = await TeacherService.getTeachers(authReq.user.tenantId, {
        status: status as string,
        subject: subject as string,
        employmentType: employmentType as string,
        search: search as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getTeacherById(req: Request, res: Response, next: NextFunction) {
    try {
      const { teacherId } = req.params;
      const teacher = await TeacherService.getTeacherById(teacherId);
      res.json({ success: true, data: teacher });
    } catch (error) {
      next(error);
    }
  }

  static async updateTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const { teacherId } = req.params;
      const validated = updateTeacherSchema.parse(req.body);

      const teacher = await TeacherService.updateTeacher(teacherId, validated);

      res.json({
        success: true,
        data: teacher,
        message: 'Teacher updated successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const { teacherId } = req.params;
      await TeacherService.deleteTeacher(teacherId);
      res.json({ success: true, message: 'Teacher deleted successfully!' });
    } catch (error) {
      next(error);
    }
  }

  static async assignSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const { teacherId } = req.params;
      const { subjectId, sectionId, academicYearId, isPrimary } = req.body;
      const teacher = await TeacherService.assignSubject(teacherId, {
        subjectId,
        sectionId,
        academicYearId,
        isPrimary,
      });
      res.json({
        success: true,
        data: teacher,
        message: 'Subject assigned successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const { teacherId, subjectId, sectionId } = req.params;
      const teacher = await TeacherService.removeSubject(
        teacherId,
        subjectId,
        sectionId,
      );
      res.json({
        success: true,
        data: teacher,
        message: 'Subject removed successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { teacherId } = req.params;
      const { date } = req.query;
      const schedule = await TeacherService.getTeacherSchedule(
        teacherId,
        date ? new Date(date as string) : undefined,
      );
      res.json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const stats = await TeacherService.getTeacherStats(authReq.user.tenantId);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // ───── Leave ─────

  static async createLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { teacherId } = req.params;
      const validated = createLeaveSchema.parse(req.body);

      const leave = await LeaveService.createLeave({
        ...validated,
        tenantId: authReq.user.tenantId,
        teacherId,
        totalDays:
          Math.ceil(
            (validated.endDate.getTime() - validated.startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1,
      });

      res.status(201).json({
        success: true,
        data: leave,
        message: 'Leave request submitted successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLeaves(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { teacherId, status, type, startDate, endDate, page, limit } =
        req.query;

      const result = await LeaveService.getLeaves(authReq.user.tenantId, {
        teacherId: teacherId as string,
        status: status as string,
        type: type as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getLeaveById(req: Request, res: Response, next: NextFunction) {
    try {
      const { leaveId } = req.params;
      const leave = await LeaveService.getLeaveById(leaveId);
      res.json({ success: true, data: leave });
    } catch (error) {
      next(error);
    }
  }

  static async updateLeaveStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { leaveId } = req.params;
      const validated = updateLeaveStatusSchema.parse(req.body);

      const leave = await LeaveService.updateLeaveStatus(
        leaveId,
        validated.status,
        authReq.user.id,
        validated.rejectionReason,
      );

      res.json({
        success: true,
        data: leave,
        message: `Leave ${validated.status} successfully!`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLeaveBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { teacherId } = req.params;
      const balance = await LeaveService.getLeaveBalance(teacherId);
      res.json({ success: true, data: balance });
    } catch (error) {
      next(error);
    }
  }

  static async deleteLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const { leaveId } = req.params;
      await LeaveService.deleteLeave(leaveId);
      res.json({ success: true, message: 'Leave request deleted successfully!' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Count of pending leave requests — used by the sidebar badge.
   */
  static async getPendingLeaveCount(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const count = await LeaveService.getPendingCount(authReq.user.tenantId);
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  }
}