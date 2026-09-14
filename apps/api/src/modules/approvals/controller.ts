import { Request, Response, NextFunction } from 'express';
import { ApprovalsService } from './service';
import { AuthRequest } from '../../middleware/auth';
import { z } from 'zod';

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

export class ApprovalsController {
  /* ═══════════════════════════════════════════════════════════
     LISTS
     ═══════════════════════════════════════════════════════════ */

  static async listPendingTeachers(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authReq = req as AuthRequest;
      const result = await ApprovalsService.listPendingTeachers(
        authReq.user.tenantId,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async listPendingStudents(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authReq = req as AuthRequest;
      const result = await ApprovalsService.listPendingStudents(
        authReq.user.tenantId,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async listPendingGuardians(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authReq = req as AuthRequest;
      const result = await ApprovalsService.listPendingGuardians(
        authReq.user.tenantId,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getPendingCounts(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authReq = req as AuthRequest;
      const result = await ApprovalsService.getPendingCounts(
        authReq.user.tenantId,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     ACTIONS — TEACHERS
     ═══════════════════════════════════════════════════════════ */

  static async approveTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { teacherId } = req.params;

      const result = await ApprovalsService.approveTeacher(
        authReq.user.tenantId,
        teacherId,
        authReq.user.email,
      );

      res.json({
        success: true,
        data: result,
        message: 'Teacher approved',
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { teacherId } = req.params;
      const { reason } = rejectSchema.parse(req.body);

      const result = await ApprovalsService.rejectTeacher(
        authReq.user.tenantId,
        teacherId,
        authReq.user.email,
        reason,
      );

      res.json({
        success: true,
        data: result,
        message: 'Teacher rejected',
      });
    } catch (error) {
      next(error);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     ACTIONS — STUDENTS
     ═══════════════════════════════════════════════════════════ */

  static async approveStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { studentId } = req.params;

      const result = await ApprovalsService.approveStudent(
        authReq.user.tenantId,
        studentId,
        authReq.user.email,
      );

      res.json({
        success: true,
        data: result,
        message: 'Student approved',
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { studentId } = req.params;
      const { reason } = rejectSchema.parse(req.body);

      const result = await ApprovalsService.rejectStudent(
        authReq.user.tenantId,
        studentId,
        authReq.user.email,
        reason,
      );

      res.json({
        success: true,
        data: result,
        message: 'Student rejected',
      });
    } catch (error) {
      next(error);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     ACTIONS — GUARDIANS
     ═══════════════════════════════════════════════════════════ */

  static async approveGuardian(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { userId } = req.params;

      const result = await ApprovalsService.approveGuardian(
        authReq.user.tenantId,
        userId,
        authReq.user.email,
      );

      res.json({
        success: true,
        data: result,
        message: 'Guardian approved',
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectGuardian(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { userId } = req.params;
      const { reason } = rejectSchema.parse(req.body);

      const result = await ApprovalsService.rejectGuardian(
        authReq.user.tenantId,
        userId,
        authReq.user.email,
        reason,
      );

      res.json({
        success: true,
        data: result,
        message: 'Guardian rejected',
      });
    } catch (error) {
      next(error);
    }
  }
}