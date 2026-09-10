import { Request, Response, NextFunction } from 'express';
import { AssignmentService } from './service';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';
import { Teacher } from '../../models/Teacher';
import { Student } from '../../models/Student';

class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

// Validation Schemas
const createAssignmentSchema = z.object({
  academicYearId: z.string().min(1),
  sectionId: z.string().min(1),
  subjectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['homework', 'classwork', 'project', 'quiz', 'test', 'exam']),
  maxScore: z.number().min(0),
  weightage: z.number().min(0).max(100),
  dueDate: z.string().transform(str => new Date(str)),
  instructions: z.string().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    size: z.number().optional(),
  })).optional(),
  isPublished: z.boolean().default(false),
});

const submitAssignmentSchema = z.object({
  assignmentId: z.string().min(1),
  studentId: z.string().optional(), // required only when admin/teacher submits on behalf
  content: z.string().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string(),
    size: z.number().optional(),
  })).optional(),
});

const gradeSubmissionSchema = z.object({
  score: z.number().min(0),
  feedback: z.string().optional(),
});

const generateReportCardSchema = z.object({
  studentId: z.string().min(1),
  academicYearId: z.string().min(1),
  term: z.enum(['first', 'second', 'third', 'final']),
});

export class AssignmentController {
  // ============ Assignments ============

  static async createAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = createAssignmentSchema.parse(req.body);

      // Look up the Teacher document for this user.
      const teacher = await Teacher.findOne({
        userId: authReq.user.id,
        tenantId: authReq.user.tenantId,
        isDeleted: false,
      });
      if (!teacher) {
        throw new AppError('Teacher profile not found for this user', 404);
      }

      const assignment = await AssignmentService.createAssignment(
        authReq.user.tenantId,
        {
          ...validated,
          teacherId: teacher._id.toString(),
          createdBy: authReq.user.id,
        }
      );

      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Assignment created successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { sectionId, subjectId, teacherId, status, type, page, limit } = req.query;

      const result = await AssignmentService.getAssignments(
        authReq.user.tenantId,
        {
          sectionId: sectionId as string,
          subjectId: subjectId as string,
          teacherId: teacherId as string,
          status: status as string,
          type: type as string,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
        }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAssignmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const assignment = await AssignmentService.getAssignmentById(id);

      res.json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = createAssignmentSchema.partial().parse(req.body);

      const assignment = await AssignmentService.updateAssignment(id, validated);

      res.json({
        success: true,
        data: assignment,
        message: 'Assignment updated successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await AssignmentService.deleteAssignment(id);

      res.json({
        success: true,
        message: 'Assignment deleted successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAssignmentStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;

      const stats = await AssignmentService.getAssignmentStats(
        authReq.user.tenantId,
        id
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Submissions ============

  static async submitAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = submitAssignmentSchema.parse(req.body);

      // `studentId` in the request body.)
      let studentId: string;
      if (authReq.user.role === 'student') {
        const student = await Student.findOne({
          userId: authReq.user.id,
          tenantId: authReq.user.tenantId,
          isDeleted: false,
        });
        if (!student) {
          throw new AppError('Student profile not found for this user', 404);
        }
        studentId = student._id.toString();
      } else {
        // Admin/teacher submitting on behalf — require explicit studentId
        const bodyStudentId = (req.body as any).studentId;
        if (!bodyStudentId) {
          throw new AppError('studentId is required when submitting on behalf of a student', 400);
        }
        studentId = bodyStudentId;
      }

      const submission = await AssignmentService.submitAssignment(
        authReq.user.tenantId,
        {
          ...validated,
          studentId,
        }
      );

      res.status(201).json({
        success: true,
        data: submission,
        message: 'Assignment submitted successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { assignmentId, studentId, status, page, limit } = req.query;

      const result = await AssignmentService.getSubmissions(
        authReq.user.tenantId,
        {
          assignmentId: assignmentId as string,
          studentId: studentId as string,
          status: status as string,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
        }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSubmissionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const submission = await AssignmentService.getSubmissionById(id);

      res.json({
        success: true,
        data: submission,
      });
    } catch (error) {
      next(error);
    }
  }

  static async gradeSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params;
      const validated = gradeSubmissionSchema.parse(req.body);

      const submission = await AssignmentService.gradeSubmission(id, {
        ...validated,
        feedback: validated.feedback ?? '',
        gradedBy: authReq.user.id,
      });

      res.json({
        success: true,
        data: submission,
        message: 'Submission graded successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Gradebook ============

  static async getGradebook(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { studentId, academicYearId } = req.params;

      const gradebook = await AssignmentService.getGradebook(
        authReq.user.tenantId,
        studentId,
        academicYearId
      );

      res.json({
        success: true,
        data: gradebook,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStudentProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { studentId, academicYearId } = req.params;

      const progress = await AssignmentService.getStudentProgress(
        authReq.user.tenantId,
        studentId,
        academicYearId
      );

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Report Cards ============

  static async generateReportCard(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = generateReportCardSchema.parse(req.body);

      const reportCard = await AssignmentService.generateReportCard(
        authReq.user.tenantId,
        {
          ...validated,
          createdBy: authReq.user.id,
        }
      );

      res.status(201).json({
        success: true,
        data: reportCard,
        message: 'Report card generated successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReportCards(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { studentId, academicYearId, term, status, page, limit } = req.query;

      const result = await AssignmentService.getReportCards(
        authReq.user.tenantId,
        {
          studentId: studentId as string,
          academicYearId: academicYearId as string,
          term: term as string,
          status: status as string,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
        }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReportCardById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const reportCard = await AssignmentService.getReportCardById(id);

      res.json({
        success: true,
        data: reportCard,
      });
    } catch (error) {
      next(error);
    }
  }

  static async publishReportCard(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const reportCard = await AssignmentService.publishReportCard(id);

      res.json({
        success: true,
        data: reportCard,
        message: 'Report card published successfully!',
      });
    } catch (error) {
      next(error);
    }
  }
}