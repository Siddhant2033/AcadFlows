import { Request, Response, NextFunction } from 'express';
import { Invoice, Payment } from '../../models/Fee';
import { Student } from '../../models/Student';
import { AuthRequest } from '../../middleware/auth';
import { sendCsv } from '../../utils/csv';

export class FeeExportController {
  /**
   * GET /fees/invoices/export
   * Query: status, studentId, startDate, endDate
   */
  static async exportInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { status, studentId, startDate, endDate } = req.query;

      const query: any = { tenantId: authReq.user.tenantId };

      if (status) query.status = status;
      if (studentId) query.studentId = studentId;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate as string);
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }

      const invoices = await Invoice.find(query)
        .sort({ createdAt: -1 })
        .lean();

      // Enrich with student info
      const studentIds = [...new Set(invoices.map(i => i.studentId))];
      const students = await Student.find({
        tenantId: authReq.user.tenantId,
        _id: { $in: studentIds },
      })
        .select('firstName lastName admissionNo rollNo grade section')
        .lean();
      const studentMap = new Map(students.map(s => [s._id.toString(), s]));

      const headers = [
        'Invoice Number',
        'Student Name',
        'Admission No',
        'Roll No',
        'Grade',
        'Section',
        'Issued Date',
        'Due Date',
        'Subtotal',
        'Discount',
        'Discount Code',
        'Total',
        'Paid Amount',
        'Balance Due',
        'Status',
        'Payment Method',
        'Payment Reference',
        'Paid On',
      ];

      const rows = invoices.map(inv => {
        const student = studentMap.get(inv.studentId);
        return [
          inv.invoiceNumber,
          student ? `${student.firstName} ${student.lastName}`.trim() : 'Unknown',
          student?.admissionNo || '',
          student?.rollNo || '',
          student?.grade || '',
          student?.section || '',
          inv.issuedDate,
          inv.dueDate,
          inv.subtotal,
          inv.discountAmount,
          inv.discountCode || '',
          inv.total,
          inv.paidAmount,
          inv.balanceDue,
          inv.status,
          inv.paymentMethod || '',
          inv.paymentReference || '',
          inv.paidAt || '',
        ];
      });

      const filename = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
      sendCsv(res, filename, headers, rows);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /fees/payments/export
   * Query: startDate, endDate, method
   */
  static async exportPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { startDate, endDate, method } = req.query;

      const query: any = { tenantId: authReq.user.tenantId };

      if (method) query.method = method;
      if (startDate || endDate) {
        query.paymentDate = {};
        if (startDate) query.paymentDate.$gte = new Date(startDate as string);
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          query.paymentDate.$lte = end;
        }
      }

      const payments = await Payment.find(query)
        .sort({ paymentDate: -1 })
        .lean();

      const studentIds = [...new Set(payments.map(p => p.studentId))];
      const students = await Student.find({
        tenantId: authReq.user.tenantId,
        _id: { $in: studentIds },
      })
        .select('firstName lastName admissionNo rollNo grade section')
        .lean();
      const studentMap = new Map(students.map(s => [s._id.toString(), s]));

      const invoiceIds = [...new Set(payments.map(p => p.invoiceId))];
      const invoices = await Invoice.find({
        tenantId: authReq.user.tenantId,
        _id: { $in: invoiceIds },
      })
        .select('invoiceNumber')
        .lean();
      const invoiceMap = new Map(invoices.map(i => [i._id.toString(), i.invoiceNumber]));

      const headers = [
        'Receipt Number',
        'Invoice Number',
        'Student Name',
        'Admission No',
        'Roll No',
        'Grade',
        'Section',
        'Payment Date',
        'Amount',
        'Method',
        'Reference',
        'Notes',
      ];

      const rows = payments.map(p => {
        const student = studentMap.get(p.studentId);
        return [
          p.receiptNumber,
          invoiceMap.get(p.invoiceId) || '',
          student ? `${student.firstName} ${student.lastName}`.trim() : 'Unknown',
          student?.admissionNo || '',
          student?.rollNo || '',
          student?.grade || '',
          student?.section || '',
          p.paymentDate,
          p.amount,
          p.method,
          p.reference || '',
          p.notes || '',
        ];
      });

      const filename = `payments_${new Date().toISOString().split('T')[0]}.csv`;
      sendCsv(res, filename, headers, rows);
    } catch (error) {
      next(error);
    }
  }
}