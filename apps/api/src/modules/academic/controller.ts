import { Request, Response, NextFunction } from 'express';
import {
  AcademicYearService,
  GradeService,
  SectionService,
  SubjectService,
  TeacherSubjectService,
  ScheduleService,
} from './service';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';
import type { TenantRequest } from '../../middleware/tenant-context';

// ─────────────────────────────────────────────────────────────
// Reusable helpers for optional strings
// ─────────────────────────────────────────────────────────────

const optionalString = z
  .union([z.string(), z.undefined(), z.null()])
  .optional()
  .transform(v => {
    if (v === undefined || v === null) return undefined;
    const trimmed = String(v).trim();
    return trimmed === '' ? undefined : trimmed;
  });

const optionalStringArray = z
  .union([z.array(z.string()), z.undefined(), z.null()])
  .optional()
  .transform(v => {
    if (!v || !Array.isArray(v)) return undefined;
    const filtered = v.filter(s => s && String(s).trim() !== '');
    return filtered.length === 0 ? undefined : filtered;
  });

// ─────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────

const academicYearSchema = z.object({
  name: z.string().min(1, 'Academic year name is required'),
  code: z.string().min(1, 'Code is required'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  description: optionalString,
});

const gradeSchema = z.object({
  name: z.string().min(1, 'Grade name is required'),
  code: z.string().min(1, 'Grade code is required'),
  sequence: z.coerce.number().min(0),
  description: optionalString,
});

const sectionSchema = z.object({
  gradeId: z.string().min(1, 'Grade is required'),
  name: z.string().min(1, 'Section name is required'),
  code: z.string().min(1, 'Section code is required'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1').default(30),
  classTeacherId: optionalString,
  roomNumber: optionalString,
});

const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  code: z.string().min(1, 'Subject code is required'),
  description: optionalString,
  gradeId: optionalString,
  credits: z.coerce.number().min(0).default(1),
  isElective: z.boolean().optional().default(false),
});

const teacherSubjectSchema = z.object({
  teacherId: z.string().min(1, 'Teacher is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  gradeId: optionalString,
  sectionId: optionalString,
  academicYearId: z.string().min(1, 'Academic year is required'),
});

const scheduleSchema = z.object({
  academicYearId: z.string().min(1),
  gradeId: z.string().min(1),
  sectionId: z.string().min(1),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  dayOfWeek: z.enum([
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  roomNumber: optionalString,
});

// ─────────────────────────────────────────────────────────────
// Helper — resolve tenantId for read-only public endpoints
// ─────────────────────────────────────────────────────────────

/**
 * Resolve the tenantId for an endpoint that may be called publicly
 * (register flow, no JWT) or authenticated (admin panels).
 *
 * Priority:
 *   1. Tenant context resolved by `tenantContext` middleware
 *      (subdomain / header / query param / cookie)
 *   2. JWT — for authenticated callers
 *
 * Returns null when neither is available; caller responds 400.
 */
function resolveTenantId(req: Request): string | null {
  const tenantReq = req as TenantRequest;
  const authReq = req as AuthRequest;

  return tenantReq.tenantId || authReq.user?.tenantId || null;
}

// ─────────────────────────────────────────────────────────────
// Academic Year Controller
// ─────────────────────────────────────────────────────────────

export class AcademicYearController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = academicYearSchema.parse(req.body);
      const academicYear = await AcademicYearService.create({
        ...validated,
        tenantId: authReq.user.tenantId,
      });
      res.status(201).json({
        success: true,
        data: academicYear,
        message: 'Academic year created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const academicYears = await AcademicYearService.getAll(authReq.user.tenantId);
      res.json({ success: true, data: academicYears });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const academicYear = await AcademicYearService.getById(req.params.id);
      res.json({ success: true, data: academicYear });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = academicYearSchema.partial().parse(req.body);
      const academicYear = await AcademicYearService.update(req.params.id, validated);
      res.json({
        success: true,
        data: academicYear,
        message: 'Academic year updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await AcademicYearService.delete(req.params.id);
      res.json({ success: true, message: 'Academic year deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async setCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      const academicYear = await AcademicYearService.setCurrent(req.params.id);
      res.json({
        success: true,
        data: academicYear,
        message: 'Current academic year updated',
      });
    } catch (error) {
      next(error);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Grade Controller
// ─────────────────────────────────────────────────────────────

export class GradeController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = gradeSchema.parse(req.body);
      const grade = await GradeService.create({
        ...validated,
        tenantId: authReq.user.tenantId,
      });
      res.status(201).json({
        success: true,
        data: grade,
        message: 'Grade created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public read — safe for register form dropdowns.
   * Tenant is resolved from context (?tenantId=... / header / cookie)
   * with fallback to the JWT for authenticated callers.
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = resolveTenantId(req);

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant context is required',
        });
      }

      const grades = await GradeService.getAll(tenantId);
      res.json({ success: true, data: grades });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const grade = await GradeService.getById(req.params.id);
      res.json({ success: true, data: grade });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = gradeSchema.partial().parse(req.body);
      const grade = await GradeService.update(req.params.id, validated);
      res.json({
        success: true,
        data: grade,
        message: 'Grade updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await GradeService.delete(req.params.id);
      res.json({ success: true, message: 'Grade deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Section Controller
// ─────────────────────────────────────────────────────────────

export class SectionController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = sectionSchema.parse(req.body);
      const section = await SectionService.create({
        ...validated,
        tenantId: authReq.user.tenantId,
      });
      res.status(201).json({
        success: true,
        data: section,
        message: 'Section created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public read — safe for register form dropdowns.
   * Tenant is resolved from context (?tenantId=... / header / cookie)
   * with fallback to the JWT for authenticated callers.
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = resolveTenantId(req);
      const { gradeId } = req.query;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant context is required',
        });
      }

      const sections = await SectionService.getAll(
        tenantId,
        gradeId as string,
      );
      res.json({ success: true, data: sections });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const section = await SectionService.getById(req.params.id);
      res.json({ success: true, data: section });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = sectionSchema.partial().parse(req.body);
      const section = await SectionService.update(req.params.id, validated);
      res.json({
        success: true,
        data: section,
        message: 'Section updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await SectionService.delete(req.params.id);
      res.json({ success: true, message: 'Section deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Subject Controller
// ─────────────────────────────────────────────────────────────

export class SubjectController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = subjectSchema.parse(req.body);
      const subject = await SubjectService.create({
        ...validated,
        tenantId: authReq.user.tenantId,
      });
      res.status(201).json({
        success: true,
        data: subject,
        message: 'Subject created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { gradeId } = req.query;
      const subjects = await SubjectService.getAll(
        authReq.user.tenantId,
        gradeId as string,
      );
      res.json({ success: true, data: subjects });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const subject = await SubjectService.getById(req.params.id);
      res.json({ success: true, data: subject });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = subjectSchema.partial().parse(req.body);
      const subject = await SubjectService.update(req.params.id, validated);
      res.json({
        success: true,
        data: subject,
        message: 'Subject updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await SubjectService.delete(req.params.id);
      res.json({ success: true, message: 'Subject deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Teacher Subject Controller
// ─────────────────────────────────────────────────────────────

export class TeacherSubjectController {
  static async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = teacherSubjectSchema.parse(req.body);
      const assignment = await TeacherSubjectService.assign({
        ...validated,
        tenantId: authReq.user.tenantId,
      });
      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Teacher assigned to subject successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { teacherId, subjectId } = req.query;
      const assignments = await TeacherSubjectService.getAll(
        authReq.user.tenantId,
        teacherId as string,
        subjectId as string,
      );
      res.json({ success: true, data: assignments });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const assignment = await TeacherSubjectService.getById(req.params.id);
      res.json({ success: true, data: assignment });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await TeacherSubjectService.delete(req.params.id);
      res.json({
        success: true,
        message: 'Assignment removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { teacherId } = req.params;
      const assignments = await TeacherSubjectService.getByTeacher(
        teacherId,
        authReq.user.tenantId,
      );
      res.json({ success: true, data: assignments });
    } catch (error) {
      next(error);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Schedule Controller
// ─────────────────────────────────────────────────────────────

export class ScheduleController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = scheduleSchema.parse(req.body);
      const schedule = await ScheduleService.create({
        ...validated,
        tenantId: authReq.user.tenantId,
      });
      res.status(201).json({
        success: true,
        data: schedule,
        message: 'Schedule created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { sectionId, teacherId } = req.query;
      const schedules = await ScheduleService.getAll(
        authReq.user.tenantId,
        sectionId as string,
        teacherId as string,
      );
      res.json({ success: true, data: schedules });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule = await ScheduleService.getById(req.params.id);
      res.json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = scheduleSchema.partial().parse(req.body);
      const schedule = await ScheduleService.update(req.params.id, validated);
      res.json({
        success: true,
        data: schedule,
        message: 'Schedule updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ScheduleService.delete(req.params.id);
      res.json({
        success: true,
        message: 'Schedule entry deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTimetableBySection(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authReq = req as AuthRequest;
      const { sectionId } = req.params;
      const timetable = await ScheduleService.getTimetableBySection(
        sectionId,
        authReq.user.tenantId,
      );
      res.json({ success: true, data: timetable });
    } catch (error) {
      next(error);
    }
  }
}