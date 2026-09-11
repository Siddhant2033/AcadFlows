import { Request, Response, NextFunction } from 'express';
import { Invoice, FeeReminder, Payment } from '../../models/Fee';
import { Student } from '../../models/Student';
import { AppError } from '../../middleware/error-handler';
import { AuthRequest } from '../../middleware/auth';
import { FeeService } from './service';
import { z } from 'zod';

const bulkGenerateSchema = z.object({
  sectionId: z.string().min(1),
  academicYearId: z.string().min(1),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        amount: z.number().min(0),
        quantity: z.number().min(1).default(1),
        category: z.string().optional(),
      }),
    )
    .min(1),
  dueDate: z.string().transform(str => new Date(str)),
  notes: z.string().optional(),
  discountCode: z.string().optional(),
  dryRun: z.boolean().optional().default(false),
});

const bulkRemindSchema = z.object({
  sectionId: z.string().optional(),
  gradeId: z.string().optional(),
  onlyOverdue: z.boolean().optional().default(true),
  dryRun: z.boolean().optional().default(false),
});

export class FeeBulkController {
  /**
   * POST /fees/invoices/bulk-generate
   * Generates invoices for all active students in a section.
   */
  static async bulkGenerateInvoices(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authReq = req as AuthRequest;
      const validated = bulkGenerateSchema.parse(req.body);

      const students = await Student.find({
        tenantId: authReq.user.tenantId,
        sectionId: validated.sectionId,
        status: 'active',
        isDeleted: false,
      })
        .select('_id firstName lastName admissionNo')
        .lean();

      if (students.length === 0) {
        throw new AppError('No active students found in this section', 404);
      }

      // Compute total for preview
      const subtotal = validated.items.reduce(
        (sum, item) => sum + item.amount * item.quantity,
        0,
      );

      if (validated.dryRun) {
        return res.json({
          success: true,
          data: {
            dryRun: true,
            studentCount: students.length,
            perStudentAmount: subtotal,
            totalAmount: subtotal * students.length,
            students: students.map(s => ({
              _id: s._id.toString(),
              name: `${s.firstName} ${s.lastName}`.trim(),
              admissionNo: s.admissionNo,
            })),
          },
        });
      }

      const results = {
        created: 0,
        failed: 0,
        errors: [] as { student: string; error: string }[],
        invoiceIds: [] as string[],
      };

      for (const student of students) {
        try {
          const invoice = await FeeService.generateInvoice(authReq.user.tenantId, {
            studentId: student._id.toString(),
            academicYearId: validated.academicYearId,
            items: validated.items,
            dueDate: validated.dueDate,
            notes: validated.notes,
            discountCode: validated.discountCode,
            createdBy: authReq.user.id,
          });
          results.created++;
          results.invoiceIds.push(invoice._id.toString());
        } catch (err) {
          results.failed++;
          results.errors.push({
            student: `${student.firstName} ${student.lastName}`,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      res.json({
        success: true,
        data: results,
        message: `Generated ${results.created} invoice${results.created === 1 ? '' : 's'}. ${results.failed} failed.`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /fees/reminders/bulk-send
   * Sends reminders for all outstanding invoices in a section/grade.
   */
  static async bulkSendReminders(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const authReq = req as AuthRequest;
      const validated = bulkRemindSchema.parse(req.body);

      // Build student filter
      const studentQuery: any = {
        tenantId: authReq.user.tenantId,
        status: 'active',
        isDeleted: false,
      };
      if (validated.sectionId) studentQuery.sectionId = validated.sectionId;
      if (validated.gradeId) studentQuery.grade = validated.gradeId;

      const students = await Student.find(studentQuery)
        .select('_id firstName lastName guardians')
        .lean();

      if (students.length === 0) {
        throw new AppError('No students found matching filters', 404);
      }

      const studentIds = students.map(s => s._id.toString());

      // Find outstanding invoices
      const invoiceQuery: any = {
        tenantId: authReq.user.tenantId,
        studentId: { $in: studentIds },
        balanceDue: { $gt: 0 },
        status: { $nin: ['cancelled', 'draft', 'paid'] },
      };
      if (validated.onlyOverdue) {
        invoiceQuery.dueDate = { $lt: new Date() };
      }

      const invoices = await Invoice.find(invoiceQuery)
        .select('_id invoiceNumber studentId balanceDue dueDate')
        .lean();

      if (invoices.length === 0) {
        return res.json({
          success: true,
          data: {
            reminderCount: 0,
            totalAmount: 0,
            students: 0,
            dryRun: validated.dryRun,
          },
          message: 'No outstanding invoices found',
        });
      }

      // Group by student
      const byStudent = new Map<string, typeof invoices>();
      for (const inv of invoices) {
        const sid = inv.studentId;
        if (!byStudent.has(sid)) byStudent.set(sid, []);
        byStudent.get(sid)!.push(inv);
      }

      if (validated.dryRun) {
        const totalAmount = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
        return res.json({
          success: true,
          data: {
            dryRun: true,
            reminderCount: byStudent.size,
            invoiceCount: invoices.length,
            totalAmount,
            students: students
              .filter(s => byStudent.has(s._id.toString()))
              .map(s => ({
                _id: s._id.toString(),
                name: `${s.firstName} ${s.lastName}`.trim(),
                guardian: s.guardians?.[0]?.name || '—',
                guardianPhone: s.guardians?.[0]?.phone || '',
                dueAmount: byStudent
                  .get(s._id.toString())!
                  .reduce((sum, inv) => sum + inv.balanceDue, 0),
              })),
          },
        });
      }

      // Create reminders
      let sent = 0;
      let failed = 0;
      let totalAmount = 0;

      for (const [studentId, studentInvoices] of byStudent.entries()) {
        try {
          const dueAmount = studentInvoices.reduce(
            (sum, inv) => sum + inv.balanceDue,
            0,
          );
          const earliestDue = studentInvoices.reduce(
            (min, inv) => (inv.dueDate < min ? inv.dueDate : min),
            studentInvoices[0]!.dueDate,
          );

          // Create a reminder record for the earliest invoice
          await FeeReminder.create({
            tenantId: authReq.user.tenantId,
            invoiceId: studentInvoices[0]!._id,
            studentId,
            type: 'email',
            dueDate: earliestDue,
            amount: dueAmount,
            status: 'sent',
            sentAt: new Date(),
          });

          sent++;
          totalAmount += dueAmount;
        } catch (err) {
          failed++;
        }
      }

      console.log(`📧 Bulk reminders sent to ${sent} students`);

      res.json({
        success: true,
        data: {
          reminderCount: sent,
          failed,
          totalAmount,
        },
        message: `Sent ${sent} reminder${sent === 1 ? '' : 's'}. ${failed} failed.`,
      });
    } catch (error) {
      next(error);
    }
  }
}