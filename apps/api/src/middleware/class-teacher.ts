import { Request, Response, NextFunction } from 'express';
import { Teacher } from '../models/Teacher';
import { Section } from '../models/Section';
import { AppError } from './error-handler';
import type { AuthRequest } from './auth';

/**
 * Ensures the authenticated user is either:
 *   - an admin (bypass), OR
 *   - the class teacher of the section referenced in req.body.sectionId
 *     (or req.params.sectionId or req.query.sectionId)
 *
 * Used on attendance endpoints so only the responsible class teacher can
 * mark attendance.
 */
export function requireClassTeacherOrAdmin() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;

      // Admins bypass
      if (authReq.user.role === 'admin') return next();

      if (authReq.user.role !== 'teacher') {
        return next(
          new AppError('Only the class teacher can perform this action', 403),
        );
      }

      const sectionId =
        req.body?.sectionId || req.params?.sectionId || req.query?.sectionId;

      if (!sectionId) {
        return next(new AppError('sectionId is required', 400));
      }

      const teacher = await Teacher.findOne({
        userId: authReq.user.id,
        tenantId: authReq.user.tenantId,
        isDeleted: false,
      });

      if (!teacher) {
        return next(new AppError('Teacher profile not found', 404));
      }

      const section = await Section.findOne({
        _id: sectionId,
        tenantId: authReq.user.tenantId,
      });

      if (!section) {
        return next(new AppError('Section not found', 404));
      }

      if (section.classTeacherId !== teacher._id.toString()) {
        return next(
          new AppError(
            'You are not the class teacher of this section',
            403,
          ),
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}