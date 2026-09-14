import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TeacherApprovalsService } from './me-approvals.service';
import { AuthRequest } from '../../middleware/auth';

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

export class TeacherApprovalsController {
  /* ═══════════════ LISTS ═══════════════ */

  static async listPendingStudents(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authReq = req as AuthRequest;
      const result = await TeacherApprovalsService.listPendingStudents(
        authReq.user.tenantId,
        authReq.user.id,
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
      const result = await TeacherApprovalsService.listPendingGuardians(
        authReq.user.tenantId,
        authReq.user.id,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getClassRoster(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authReq = req as AuthRequest;
      const result = await TeacherApprovalsService.getClassRoster(
        authReq.user.tenantId,
        authReq.user.id,
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
      const [students, guardians] = await Promise.all([
        TeacherApprovalsService.listPendingStudents(
          authReq.user.tenantId,
          authReq.user.id,
        ),
        TeacherApprovalsService.listPendingGuardians(
          authReq.user.tenantId,
          authReq.user.id,
        ),
      ]);

      res.json({
        success: true,
        data: {
          students: students.total,
          guardians: guardians.total,
          total: students.total + guardians.total,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /* ═══════════════ ACTIONS — STUDENTS ═══════════════ */

  static async approveStudent(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authReq = req as AuthRequest;
      const { studentId } = req.params;

      const result = await TeacherApprovalsService.approveStudent(
        authReq.user.tenantId,
        authReq.user.id,
        studentId,
        authReq.user.email,
      );

      res.json({ success: true, data: result, message: 'Student approved' });
    } catch (error) {
      next(error);
    }
  }

  static async rejectStudent(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authReq = req as AuthRequest;
      const { studentId } = req.params;
      const { reason } = rejectSchema.parse(req.body);

      const result = await TeacherApprovalsService.rejectStudent(
        authReq.user.tenantId,
        authReq.user.id,
        studentId,
        authReq.user.email,
        reason,
      );

      res.json({ success: true, data: result, message: 'Student rejected' });
    } catch (error) {
      next(error);
    }
  }

  /* ═══════════════ ACTIONS — GUARDIANS ═══════════════ */

  static async approveGuardian(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authReq = req as AuthRequest;
      const { guardianId } = req.params;

      const result = await TeacherApprovalsService.approveGuardian(
        authReq.user.tenantId,
        authReq.user.id,
        guardianId,
        authReq.user.email,
      );

      res.json({ success: true, data: result, message: 'Guardian approved' });
    } catch (error) {
      next(error);
    }
  }

  static async rejectGuardian(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authReq = req as AuthRequest;
      const { guardianId } = req.params;
      const { reason } = rejectSchema.parse(req.body);

      const result = await TeacherApprovalsService.rejectGuardian(
        authReq.user.tenantId,
        authReq.user.id,
        guardianId,
        authReq.user.email,
        reason,
      );

      res.json({ success: true, data: result, message: 'Guardian rejected' });
    } catch (error) {
      next(error);
    }
  }
}