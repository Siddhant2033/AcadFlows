import { Request, Response, NextFunction } from 'express';
import { StudentService } from './service';
import { z } from 'zod';

const verifyRollNoSchema = z.object({
  rollNo: z.string().min(1, 'Roll number is required'),
  tenantId: z.string().min(1, 'School ID is required'),
});

const createStudentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  admissionNo: z.string().min(1),
  rollNo: z.string().min(1),
  grade: z.string().min(1),
  section: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  guardians: z.array(z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    relationship: z.string(),
  })),
  address: z.string().optional(),
});

export class StudentController {
  static async verifyRollNo(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = verifyRollNoSchema.parse(req.body);
      const result = await StudentService.verifyRollNo(
        validated.rollNo,
        validated.tenantId
      );
      
      if (!result.valid) {
        return res.status(404).json({
          success: false,
          error: 'Invalid roll number. Please check and try again.',
          data: null,
        });
      }
      
      res.json({
        success: true,
        data: result.student,
        message: `Student found: ${result.student!.firstName} ${result.student!.lastName}`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStudentsByTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId } = req.params;
      const students = await StudentService.getStudentsByTenant(tenantId);
      res.json({
        success: true,
        data: students,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStudentById(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await StudentService.getStudentById(req.params.studentId);
      res.json({
        success: true,
        data: student,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createStudentSchema.parse(req.body);
      const student = await StudentService.createStudent({
        ...validated,
        tenantId: (req as any).tenantId,
        userId: (req as any).user.id,
      });
      res.status(201).json({
        success: true,
        data: student,
        message: 'Student created successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await StudentService.updateStudent(
        req.params.studentId,
        req.body
      );
      res.json({
        success: true,
        data: student,
        message: 'Student updated successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyGuardian(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const { verificationCode } = req.body;
      
      const result = await StudentService.verifyGuardian(
        studentId,
        verificationCode,
        (req as any).user.id
      );
      
      res.json({
        success: true,
        data: result,
        message: 'Guardian verified successfully!',
      });
    } catch (error) {
      next(error);
    }
  }
}