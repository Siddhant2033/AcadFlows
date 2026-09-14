import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Student } from '../../models/Student';
import { Tenant } from '../../models/Tenant';
import { AppError } from '../../middleware/error-handler';

const verifyIdentitySchema = z
  .object({
    tenantId: z.string().min(1),
    rollNo: z.string().min(1).max(50),
    admissionNo: z.string().min(1).max(50),
  })
  .strict();

/**
 * POST /students/verify-identity
 *
 * Public — called during student registration BEFORE the account is
 * created.
 *
 * Return semantics (important — non-blocking):
 *
 *   { found: true,  student: {...} }  → a matching active Student record
 *     exists and has no linked User. The register flow will link the
 *     new User to this record. Pre-fills name / grade / section.
 *
 *   { found: false }                  → no matching record. This is NOT
 *     an error. The register flow continues and the teacher/admin
 *     verifies the details at approval time.
 *
 * Only a hard error is thrown when the tenant itself is invalid or
 * inactive — those are true misuse cases.
 */
export class StudentIdentityController {
  static async verifyIdentity(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const validated = verifyIdentitySchema.parse(req.body);

      if (!mongoose.Types.ObjectId.isValid(validated.tenantId)) {
        throw new AppError('Invalid tenantId', 400);
      }

      const tenant = await Tenant.findOne({
        _id: validated.tenantId,
        status: 'active',
      })
        .select('_id name')
        .lean();

      if (!tenant) {
        throw new AppError('School is not active', 404);
      }

      const rollNo = validated.rollNo.trim().toUpperCase();
      const admissionNo = validated.admissionNo.trim().toUpperCase();

      const student = await Student.findOne({
        tenantId: validated.tenantId,
        rollNo,
        admissionNo,
        isDeleted: false,
      })
        .select(
          '_id firstName lastName grade section sectionId rollNo admissionNo userId status',
        )
        .lean();

      // ── No match: non-error, "found: false" ──
      if (!student) {
        return res.json({
          success: true,
          data: {
            found: false,
            message:
              'No matching student record found. You can continue registration; your teacher or admin will verify your details.',
          },
        });
      }

      // ── Match found, but inactive: still return found: false ──
      if (student.status !== 'active') {
        return res.json({
          success: true,
          data: {
            found: false,
            message:
              'A student record was found but is not active. Contact your school administrator.',
          },
        });
      }

      // ── Match found, but already linked to a User ──
      const { User } = await import('../../models/User');
      const existingUser = await User.findOne({ _id: student.userId })
        .select('_id email status')
        .lean();

      if (existingUser && existingUser.status !== 'inactive') {
        return res.json({
          success: true,
          data: {
            found: false,
            message:
              'An account already exists for this student. Use login or password reset.',
          },
        });
      }

      // ── Happy path ──
      res.json({
        success: true,
        data: {
          found: true,
          student: {
            id: student._id.toString(),
            firstName: student.firstName,
            lastName: student.lastName,
            grade: student.grade,
            section: student.section || '',
            sectionId: student.sectionId || null,
            rollNo: student.rollNo,
            admissionNo: student.admissionNo,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}