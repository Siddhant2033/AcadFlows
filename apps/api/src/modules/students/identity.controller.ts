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
 * created. Confirms that a student record exists matching both the
 * roll number and admission number, that it is active, and that it
 * does NOT already have a linked User account.
 *
 * Returns minimal, non-PII identifying info (name + grade/section)
 * so the register UI can show "Found: Arjun Mehta, Class 5A" for
 * the user to confirm.
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

      if (!student) {
        throw new AppError(
          'No student found with this roll number and admission number',
          404,
        );
      }

      if (student.status !== 'active') {
        throw new AppError(
          'This student record is not active. Contact your school administrator.',
          403,
        );
      }

      // A User account is auto-created by the admin flow; if one already
      // exists, block self-registration to prevent hijacking.
      const { User } = await import('../../models/User');
      const existingUser = await User.findOne({
        _id: student.userId,
      })
        .select('_id email status')
        .lean();

      if (existingUser && existingUser.status !== 'inactive') {
        throw new AppError(
          'An account already exists for this student. Use login or password reset.',
          409,
        );
      }

      res.json({
        success: true,
        data: {
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