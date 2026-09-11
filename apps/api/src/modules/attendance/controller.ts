import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from './service';
import { Teacher } from '../../models/Teacher';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';

// Validation Schemas
const markStudentAttendanceSchema = z.object({
  sectionId: z.string().min(1),
  academicYearId: z.string().min(1),
  date: z.string().transform(str => new Date(str)),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(['present', 'absent', 'late', 'half_day']),
      checkInTime: z.string().transform(str => new Date(str)).optional(),
      remarks: z.string().optional(),
    }),
  ),
});

const markTeacherAttendanceSchema = z.object({
  academicYearId: z.string().min(1),
  date: z.string().transform(str => new Date(str)),
  records: z.array(
    z.object({
      teacherId: z.string().min(1),
      status: z.enum(['present', 'absent', 'late', 'half_day']),
      checkInTime: z.string().transform(str => new Date(str)).optional(),
      checkOutTime: z.string().transform(str => new Date(str)).optional(),
      remarks: z.string().optional(),
    }),
  ),
});

const markHolidaySchema = z.object({
  date: z.string().transform(str => new Date(str)),
  reason: z.string().min(1),
  sectionId: z.string().optional(),
  academicYearId: z.string().min(1),
});

const getAttendanceQuerySchema = z.object({
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
  status: z.string().optional(),
  page: z.string().transform(str => parseInt(str)).optional(),
  limit: z.string().transform(str => parseInt(str)).optional(),
});

export class AttendanceController {
  // Mark student attendance
  static async markStudentAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = markStudentAttendanceSchema.parse(req.body);

      const result = await AttendanceService.markStudentAttendance(
        authReq.user.tenantId,
        {
          ...validated,
          markedBy: authReq.user.id,
        },
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Student attendance marked successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark teacher attendance
  static async markTeacherAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = markTeacherAttendanceSchema.parse(req.body);

      const result = await AttendanceService.markTeacherAttendance(
        authReq.user.tenantId,
        {
          ...validated,
          markedBy: authReq.user.id,
        },
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Teacher attendance marked successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all active teachers for the marking UI.
   * Returns only the fields the UI needs.
   */
  static async getAllTeachersForAttendance(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authReq = req as AuthRequest;

      const teachers = await Teacher.find({
        tenantId: authReq.user.tenantId,
        status: 'active',
        isDeleted: false,
      })
        .select('_id firstName lastName employeeId email phone')
        .sort({ firstName: 1 })
        .lean();

      res.json({
        success: true,
        data: teachers.map(t => ({
          _id: t._id.toString(),
          firstName: t.firstName,
          lastName: t.lastName,
          employeeId: t.employeeId,
          email: t.email,
          phone: t.phone || '',
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  // Get student attendance
  static async getStudentAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { studentId } = req.params;
      const validated = getAttendanceQuerySchema.parse(req.query);

      const result = await AttendanceService.getStudentAttendance(
        authReq.user.tenantId,
        studentId,
        validated,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Get teacher attendance
  static async getTeacherAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { teacherId } = req.params;
      const validated = getAttendanceQuerySchema.parse(req.query);

      const result = await AttendanceService.getTeacherAttendance(
        authReq.user.tenantId,
        teacherId,
        validated,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Get section attendance report
  static async getSectionReport(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { sectionId } = req.params;
      const { academicYearId, month, year } = req.query;

      const result = await AttendanceService.getSectionAttendanceReport(
        authReq.user.tenantId,
        sectionId,
        academicYearId as string,
        month ? parseInt(month as string) : undefined,
        year ? parseInt(year as string) : undefined,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Teacher attendance report — all teachers for a given month.
   */
  static async getTeacherReport(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { academicYearId, month, year } = req.query;

      if (!academicYearId) {
        return res.status(400).json({
          success: false,
          error: 'academicYearId is required',
        });
      }

      const result = await AttendanceService.getTeacherAttendanceReport(
        authReq.user.tenantId,
        academicYearId as string,
        month !== undefined ? parseInt(month as string) : undefined,
        year !== undefined ? parseInt(year as string) : undefined,
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Mark holiday
  static async markHoliday(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = markHolidaySchema.parse(req.body);

      const holiday = await AttendanceService.markHoliday(authReq.user.tenantId, {
        ...validated,
        markedBy: authReq.user.id,
      });

      res.status(201).json({
        success: true,
        data: holiday,
        message: 'Holiday marked successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get attendance stats
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { academicYearId, sectionId } = req.query;

      const stats = await AttendanceService.getAttendanceStats(
        authReq.user.tenantId,
        academicYearId as string,
        sectionId as string,
      );

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}