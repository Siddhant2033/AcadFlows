import { Request, Response, NextFunction } from 'express';
import { Student } from '../../models/Student';
import { Grade } from '../../models/Grade';
import { Section } from '../../models/Section';
import { AcademicYear } from '../../models/AcademicYear';
import { AppError } from '../../middleware/error-handler';
import { AuthRequest } from '../../middleware/auth';
import { z } from 'zod';

const promoteSchema = z.object({
  fromGrade: z.string().min(1),       // "Class 5"
  toGrade: z.string().min(1),         // "Class 6"
  toSectionId: z.string().min(1),     // destination section
  academicYearId: z.string().min(1),  // new academic year
  dryRun: z.boolean().optional().default(false),
});

const transferSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1),
  toSectionId: z.string().min(1),
  toGrade: z.string().min(1),
  academicYearId: z.string().min(1),
  dryRun: z.boolean().optional().default(false),
});

export class StudentBulkController {
  /**
   * POST /students/bulk-promote
   * Promotes all active students from one grade to the next.
   */
  static async bulkPromote(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = promoteSchema.parse(req.body);

      const [toSection, academicYear] = await Promise.all([
        Section.findOne({
          _id: validated.toSectionId,
          tenantId: authReq.user.tenantId,
        }).lean(),
        AcademicYear.findOne({
          _id: validated.academicYearId,
          tenantId: authReq.user.tenantId,
        }).lean(),
      ]);

      if (!toSection) throw new AppError('Destination section not found', 404);
      if (!academicYear) throw new AppError('Academic year not found', 404);

      const students = await Student.find({
        tenantId: authReq.user.tenantId,
        grade: validated.fromGrade,
        status: 'active',
        isDeleted: false,
      })
        .select('_id firstName lastName admissionNo grade section sectionId')
        .lean();

      if (students.length === 0) {
        throw new AppError('No active students found in the source grade', 404);
      }

      if (validated.dryRun) {
        return res.json({
          success: true,
          data: {
            dryRun: true,
            studentCount: students.length,
            fromGrade: validated.fromGrade,
            toGrade: validated.toGrade,
            toSection: toSection.name,
            academicYear: academicYear.name,
            students: students.map(s => ({
              _id: s._id.toString(),
              name: `${s.firstName} ${s.lastName}`.trim(),
              admissionNo: s.admissionNo,
              currentSection: s.section || '—',
            })),
          },
        });
      }

      // Perform promotion
      let promoted = 0;
      const errors: { student: string; error: string }[] = [];

      for (const student of students) {
        try {
          // Close current enrollment, add new one
          const enrollmentId = new ObjectId();
          const result = await Student.findByIdAndUpdate(
            student._id,
            {
              $set: {
                grade: validated.toGrade,
                section: toSection.name,
                sectionId: toSection._id.toString(),
              },
              $push: {
                enrollments: {
                  _id: enrollmentId,
                  academicYearId: validated.academicYearId,
                  sectionId: toSection._id.toString(),
                  rollNo: student.admissionNo,
                  enrollmentDate: new Date(),
                  status: 'active',
                },
              },
            },
            { new: true },
          );

          if (result) promoted++;
        } catch (err) {
          errors.push({
            student: `${student.firstName} ${student.lastName}`,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      res.json({
        success: true,
        data: { promoted, failed: errors.length, errors },
        message: `Promoted ${promoted} student${promoted === 1 ? '' : 's'}. ${errors.length} failed.`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /students/bulk-transfer
   * Moves a list of students to a different section.
   */
  static async bulkTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = transferSchema.parse(req.body);

      const toSection = await Section.findOne({
        _id: validated.toSectionId,
        tenantId: authReq.user.tenantId,
      }).lean();

      if (!toSection) throw new AppError('Destination section not found', 404);

      const students = await Student.find({
        tenantId: authReq.user.tenantId,
        _id: { $in: validated.studentIds },
        isDeleted: false,
      })
        .select('_id firstName lastName admissionNo grade section sectionId')
        .lean();

      if (students.length === 0) {
        throw new AppError('No students found', 404);
      }

      if (validated.dryRun) {
        return res.json({
          success: true,
          data: {
            dryRun: true,
            studentCount: students.length,
            toSection: toSection.name,
            toGrade: validated.toGrade,
            students: students.map(s => ({
              _id: s._id.toString(),
              name: `${s.firstName} ${s.lastName}`.trim(),
              currentSection: s.section || '—',
              newSection: toSection.name,
            })),
          },
        });
      }

      let transferred = 0;
      const errors: { student: string; error: string }[] = [];

      for (const student of students) {
        try {
          await Student.findByIdAndUpdate(student._id, {
            $set: {
              grade: validated.toGrade,
              section: toSection.name,
              sectionId: toSection._id.toString(),
            },
          });
          transferred++;
        } catch (err) {
          errors.push({
            student: `${student.firstName} ${student.lastName}`,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      res.json({
        success: true,
        data: { transferred, failed: errors.length, errors },
        message: `Transferred ${transferred} student${transferred === 1 ? '' : 's'}. ${errors.length} failed.`,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Helper — needed for enrollment _id
import { Types } from 'mongoose';
class ObjectId {
  constructor() {
    return new Types.ObjectId();
  }
}