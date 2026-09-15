import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { StudentService } from './service';
import { Student } from '../../models/Student';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/error-handler';

// ─────────────────────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────────────────────

const createStudentSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  middleName: z.string().trim().optional(),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .email('Email must be a valid address (e.g., student@school.com)'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  grade: z.string().trim().min(1, 'Grade is required'),
  section: z.string().trim().optional(),
  sectionId: z.string().trim().optional(),
  dateOfBirth: z.string().transform(str => new Date(str)),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z
    .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .optional(),
  nationality: z.string().trim().optional(),
  religion: z.string().trim().optional(),
  motherTongue: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  guardians: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        phone: z.string().trim().min(1),
        email: z
          .union([z.string().email(), z.literal(''), z.undefined()])
          .optional(),
        relationship: z.enum([
          'father',
          'mother',
          'guardian',
          'grandfather',
          'grandmother',
          'uncle',
          'aunt',
          'other',
        ]),
        occupation: z.string().trim().optional(),
      }),
    )
    .optional(),
  address: z.object({
    street: z.string().trim().optional(),
    city: z.string().trim().min(1, 'City is required'),
    state: z.string().trim().min(1, 'State is required'),
    country: z.string().trim().default('India'),
    postalCode: z.string().trim().min(1, 'Postal code is required'),
  }),
  emergencyContact: z.object({
    name: z.string().trim().min(1, 'Emergency contact name is required'),
    phone: z.string().trim().min(1, 'Emergency contact phone is required'),
    relationship: z.string().trim().min(1, 'Emergency contact relationship is required'),
  }),
  previousSchool: z
    .object({
      name: z.string().trim().optional(),
      address: z.string().trim().optional(),
      year: z.string().trim().optional(),
      reason: z.string().trim().optional(),
    })
    .optional(),
  medicalInfo: z
    .object({
      allergies: z.array(z.string()).optional(),
      medicalConditions: z.array(z.string()).optional(),
      medications: z.array(z.string()).optional(),
      emergencyNotes: z.string().trim().optional(),
    })
    .optional(),
  enrollments: z
    .array(
      z.object({
        academicYearId: z.string(),
        sectionId: z.string(),
      }),
    )
    .optional(),
});

const updateStudentSchema = createStudentSchema.partial();

const enrollStudentSchema = z.object({
  academicYearId: z.string().min(1),
  sectionId: z.string().min(1),
  grade: z.string().min(1),
  sectionName: z.string().optional(),
});

const bulkImportSchema = z.object({
  students: z.array(
    z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      middleName: z.string().optional(),
      email: z.string().email(),
      grade: z.string().min(1),
      section: z.string().optional(),
      dateOfBirth: z.string().optional(),
      gender: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      guardianName: z.string().optional(),
      guardianPhone: z.string().optional(),
      guardianRelationship: z.string().optional(),
    }),
  ),
});

const verifyRollNoSchema = z.object({
  rollNo: z.string().min(1),
  tenantId: z.string().min(1),
});

// ─────────────────────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────────────────────

export class StudentController {
  /**
   * Public — return minimal student info for a tenant.
   * Used by guardian registration to list children without exposing full PII.
   */
  static async getStudentsByTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = req.params;

      if (!tenantId || !mongoose.Types.ObjectId.isValid(tenantId)) {
        return res.status(400).json({ success: false, error: 'Invalid tenantId' });
      }

      const students = await StudentService.getPublicStudentList(tenantId);

      res.json({ success: true, data: students });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public — verify a student roll number and return minimal info.
   */
  static async verifyRollNo(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = verifyRollNoSchema.parse(req.body);

      const result = await StudentService.verifyRollNo(
        validated.tenantId,
        validated.rollNo.trim().toUpperCase(),
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // ─── Authenticated endpoints ───────────────────────────────

  /**
   * Return the currently logged-in student's profile.
   * Used by student dashboard and gradebook.
   */
  static async getCurrentStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;

      const student = await Student.findOne({
        userId: authReq.user.id,
        tenantId: authReq.user.tenantId,
        isDeleted: false,
      }).populate('userId', 'email phone profilePicture');

      if (!student) {
        throw new AppError('Student profile not found for this user', 404);
      }

      res.json({ success: true, data: student });
    } catch (error) {
      next(error);
    }
  }

  static async createStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = createStudentSchema.parse(req.body);

      // NOTE: We intentionally do NOT pass `userId: authReq.user.id` — that
      // is the admin's user ID. The service creates a fresh User for the
      // student when `userId` is not provided. `createdBy` tracks who
      // performed the action.
      const result = await StudentService.createStudent({
        ...validated,
        tenantId: authReq.user.tenantId,
        createdBy: authReq.user.id,
      });

      res.status(201).json({
        success: true,
        data: result.student,
        // Only present when a temporary password was auto-generated.
        // Frontend can display this once so the admin can share it.
        ...(result.tempPassword && {
          message: `Student created successfully! Temporary password: ${result.tempPassword}`,
          meta: { tempPassword: result.tempPassword },
        }),
        ...(!result.tempPassword && {
          message: 'Student created successfully!',
        }),
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { grade, section, sectionId, status, search, page, limit } = req.query;

      const result = await StudentService.getStudents(authReq.user.tenantId, {
        grade: grade as string,
        section: section as string,
        sectionId: sectionId as string,
        status: status as string,
        search: search as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getStudentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const student = await StudentService.getStudentById(studentId);

      res.json({ success: true, data: student });
    } catch (error) {
      next(error);
    }
  }

  static async updateStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const validated = updateStudentSchema.parse(req.body);

      const student = await StudentService.updateStudent(studentId, validated);

      res.json({
        success: true,
        data: student,
        message: 'Student updated successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      await StudentService.deleteStudent(studentId);

      res.json({
        success: true,
        message: 'Student deleted successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async enrollStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const validated = enrollStudentSchema.parse(req.body);

      const student = await StudentService.enrollStudent(studentId, validated);

      res.json({
        success: true,
        data: student,
        message: 'Student enrolled successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async withdrawStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        throw new AppError('Withdrawal reason is required', 400);
      }

      const student = await StudentService.withdrawStudent(studentId, reason);

      res.json({
        success: true,
        data: student,
        message: 'Student withdrawn successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkImport(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = bulkImportSchema.parse(req.body);

      const result = await StudentService.bulkImportStudents(
        authReq.user.tenantId,
        validated.students,
      );

      res.json({
        success: true,
        data: result,
        message: `Imported ${result.success} students successfully. ${result.failed} failed.`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const { type, name } = req.body;
      const file = (req as any).file;

      if (!file) {
        throw new AppError('No file uploaded', 400);
      }

      const url = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      const document = await StudentService.uploadDocument(studentId, {
        type,
        name: name || file.originalname,
        url,
        size: file.size,
        mimeType: file.mimetype,
      });

      res.json({
        success: true,
        data: document,
        message: 'Document uploaded successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const stats = await StudentService.getStudentStats(authReq.user.tenantId);

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async searchStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { q } = req.query;

      if (!q) {
        throw new AppError('Search query is required', 400);
      }

      const result = await StudentService.getStudents(authReq.user.tenantId, {
        search: q as string,
        limit: 10,
      });

      res.json({ success: true, data: result.items });
    } catch (error) {
      next(error);
    }
  }
}