import { Request, Response, NextFunction } from 'express';
import { TeacherService, LeaveService } from './service';
import { Teacher } from '../../models/Teacher';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/error-handler';

const createTeacherSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  dateOfBirth: z.string().transform(str => new Date(str)),
  gender: z.enum(['male', 'female', 'other']),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  nationality: z.string().optional(),
  religion: z.string().optional(),
  phone: z.string().min(1),
  alternativeEmail: z.string().email().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().default('India'),
    postalCode: z.string().min(1),
  }),
  qualifications: z
    .array(
      z.object({
        degree: z.string().min(1),
        institution: z.string().min(1),
        year: z.number().min(1900),
        specialization: z.string().optional(),
        grade: z.string().optional(),
      }),
    )
    .optional(),
  experience: z
    .array(
      z.object({
        institution: z.string().min(1),
        position: z.string().min(1),
        fromDate: z.string().transform(str => new Date(str)),
        toDate: z.string().transform(str => new Date(str)).optional(),
        isCurrent: z.boolean().default(false),
        responsibilities: z.string().optional(),
      }),
    )
    .optional(),
  subjects: z.array(z.string()).optional(),
  specialization: z.array(z.string()).optional(),
  joiningDate: z.string().transform(str => new Date(str)),
  employmentType: z
    .enum(['permanent', 'contract', 'temporary', 'probation'])
    .default('permanent'),
  contractEndDate: z.string().transform(str => new Date(str)).optional(),
  salary: z
    .object({
      amount: z.number().min(0),
      currency: z.string().default('INR'),
      frequency: z.enum(['monthly', 'weekly', 'hourly']).default('monthly'),
    })
    .optional(),
  bankDetails: z
    .object({
      bankName: z.string().min(1),
      accountNumber: z.string().min(1),
      ifscCode: z.string().min(1),
      branchName: z.string().min(1),
    })
    .optional(),
  emergencyContact: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    relationship: z.string().min(1),
  }),
});

const updateTeacherSchema = createTeacherSchema.partial();

const createLeaveSchema = z.object({
  type: z.enum(['annual', 'sick', 'casual', 'other']),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  reason: z.string().min(1),
  isHalfDay: z.boolean().default(false),
  attachment: z.string().optional(),
});

const updateLeaveStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
});

export class TeacherController {
  /**
   * Returns the teacher profile for the currently authenticated user.
   * Used by the frontend to know which section this teacher is class teacher of.
   */
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

      res.json({
        success: true,
        data: teacher,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = createTeacherSchema.parse(req.body);

      const teacher = await TeacherService.createTeacher({
        ...validated,
        tenantId: authReq.user.tenantId,
      });

      res.status(201).json({
        success: true,
        data: teacher,
        message: 'Teacher created successfully!',
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

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeacherById(req: Request, res: Response, next: NextFunction) {
    try {
      const { teacherId } = req.params;
      const teacher = await TeacherService.getTeacherById(teacherId);

      res.json({
        success: true,
        data: teacher,
      });
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

      res.json({
        success: true,
        message: 'Teacher deleted successfully!',
      });
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
      const teacher = await TeacherService.removeSubject(teacherId, subjectId, sectionId);

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

      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const stats = await TeacherService.getTeacherStats(authReq.user.tenantId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // ─────────────── Leave Management ───────────────

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
      const { teacherId, status, type, startDate, endDate, page, limit } = req.query;

      const result = await LeaveService.getLeaves(authReq.user.tenantId, {
        teacherId: teacherId as string,
        status: status as string,
        type: type as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLeaveById(req: Request, res: Response, next: NextFunction) {
    try {
      const { leaveId } = req.params;
      const leave = await LeaveService.getLeaveById(leaveId);

      res.json({
        success: true,
        data: leave,
      });
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

      res.json({
        success: true,
        data: balance,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const { leaveId } = req.params;
      await LeaveService.deleteLeave(leaveId);

      res.json({
        success: true,
        message: 'Leave request deleted successfully!',
      });
    } catch (error) {
      next(error);
    }
  }
}