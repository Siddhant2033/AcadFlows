import mongoose from 'mongoose';
import { Invoice, Payment } from '../../models/Fee';
import { Student } from '../../models/Student';
import { Grade } from '../../models/Grade';
import { Section } from '../../models/Section';
import { AppError } from '../../middleware/error-handler';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Compute date range from a friendly preset.
 */
export function parseDateRange(preset?: string, from?: string, to?: string): DateRange {
  const now = new Date();

  if (preset === 'this-month') {
    return {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    };
  }

  if (preset === 'last-month') {
    return {
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      endDate: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
    };
  }

  if (preset === 'this-quarter') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    return {
      startDate: new Date(now.getFullYear(), quarterStartMonth, 1),
      endDate: new Date(now.getFullYear(), quarterStartMonth + 3, 0, 23, 59, 59),
    };
  }

  if (preset === 'this-year') {
    return {
      startDate: new Date(now.getFullYear(), 0, 1),
      endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
    };
  }

  if (preset === 'academic-year') {
    // Indian academic year: April 1 → March 31
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return {
      startDate: new Date(year, 3, 1), // April 1
      endDate: new Date(year + 1, 2, 31, 23, 59, 59), // March 31
    };
  }

  // Custom range
  if (from && to) {
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  // Default: this month
  return {
    startDate: new Date(now.getFullYear(), now.getMonth(), 1),
    endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
  };
}

export class FeeReportsService {
  /**
   * Collection summary: total invoiced, collected, outstanding, rate.
   * Optional filters: gradeId, sectionId, academicYearId.
   */
  static async getCollectionSummary(
    tenantId: string,
    range: DateRange,
    filters: {
      academicYearId?: string;
      gradeId?: string;
      sectionId?: string;
    },
  ) {
    const match: any = {
      tenantId,
      createdAt: { $gte: range.startDate, $lte: range.endDate },
    };

    if (filters.academicYearId) match.academicYearId = filters.academicYearId;
    if (filters.sectionId) match.sectionId = filters.sectionId;

    // If filtering by grade, find students first
    if (filters.gradeId && !filters.sectionId) {
      const students = await Student.find({
        tenantId,
        grade: filters.gradeId,
        isDeleted: false,
      }).select('_id');

      match.studentId = { $in: students.map(s => s._id.toString()) };
    }

    const invoices = await Invoice.find(match);

    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
    const totalDiscount = invoices.reduce((sum, inv) => sum + (inv.discountAmount || 0), 0);

    const paidCount = invoices.filter(inv => inv.status === 'paid').length;
    const partialCount = invoices.filter(inv => inv.status === 'partially_paid').length;
    const overdueCount = invoices.filter(
      inv => inv.balanceDue > 0 && new Date(inv.dueDate) < new Date(),
    ).length;
    const draftCount = invoices.filter(inv => inv.status === 'draft').length;

    const collectionRate =
      totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

    // Daily collection trend (for chart)
    const dailyCollections = await Payment.aggregate([
      {
        $match: {
          tenantId,
          paymentDate: { $gte: range.startDate, $lte: range.endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' },
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Collection by method
    const byMethod = await Payment.aggregate([
      {
        $match: {
          tenantId,
          paymentDate: { $gte: range.startDate, $lte: range.endDate },
        },
      },
      {
        $group: {
          _id: '$method',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    return {
      range: {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
      },
      summary: {
        totalInvoiced,
        totalCollected,
        totalOutstanding,
        totalDiscount,
        collectionRate: Math.round(collectionRate * 10) / 10,
        invoiceCount: invoices.length,
      },
      statusBreakdown: {
        paid: paidCount,
        partially_paid: partialCount,
        overdue: overdueCount,
        draft: draftCount,
      },
      dailyCollections: dailyCollections.map(d => ({
        date: d._id,
        amount: d.amount,
        count: d.count,
      })),
      byMethod: byMethod.map(m => ({
        method: m._id,
        amount: m.amount,
        count: m.count,
      })),
    };
  }

  /**
   * Defaulters list: students with outstanding fees.
   * Sorted by amount due (highest first).
   */
  static async getDefaulters(
    tenantId: string,
    filters: {
      academicYearId?: string;
      gradeId?: string;
      sectionId?: string;
      minAmount?: number;
    },
  ) {
    const match: any = {
      tenantId,
      balanceDue: { $gt: filters.minAmount || 0 },
      status: { $nin: ['cancelled', 'draft'] },
    };

    if (filters.academicYearId) match.academicYearId = filters.academicYearId;
    if (filters.sectionId) match.sectionId = filters.sectionId;

    const invoices = await Invoice.find(match).lean();

    // Aggregate by student
    const studentDues = new Map<string, number>();
    for (const inv of invoices) {
      const sid = inv.studentId;
      studentDues.set(sid, (studentDues.get(sid) || 0) + (inv.balanceDue || 0));
    }

    if (studentDues.size === 0) {
      return { items: [], total: 0, totalOutstanding: 0 };
    }

    const studentIds = [...studentDues.keys()];

    const studentsQuery: any = {
      tenantId,
      _id: { $in: studentIds },
      isDeleted: false,
    };

    if (filters.gradeId) studentsQuery.grade = filters.gradeId;

    const students = await Student.find(studentsQuery).lean();

    // Build section map for display
    const sectionIds = students
      .map(s => s.sectionId)
      .filter((id): id is string => Boolean(id));
    const sections = await Section.find({
      tenantId,
      _id: { $in: sectionIds },
    }).lean();
    const sectionMap = new Map(sections.map(s => [s._id.toString(), s.name]));

    const items = students
      .map(s => {
        const sid = s._id.toString();
        const dueAmount = studentDues.get(sid) || 0;
        const guardians = s.guardians || [];
        const primaryGuardian = guardians[0];

        return {
          studentId: sid,
          admissionNo: s.admissionNo,
          rollNo: s.rollNo,
          name: `${s.firstName} ${s.lastName}`.trim(),
          firstName: s.firstName,
          lastName: s.lastName,
          grade: s.grade,
          section: s.sectionId ? sectionMap.get(s.sectionId) || s.section || '' : s.section || '',
          sectionId: s.sectionId || null,
          guardianName: primaryGuardian?.name || '',
          guardianPhone: primaryGuardian?.phone || '',
          guardianEmail: primaryGuardian?.email || '',
          dueAmount,
        };
      })
      .filter(item => item.dueAmount > 0)
      .sort((a, b) => b.dueAmount - a.dueAmount);

    const totalOutstanding = items.reduce((sum, item) => sum + item.dueAmount, 0);

    return {
      items,
      total: items.length,
      totalOutstanding,
    };
  }

  /**
   * Daybook: all payments received on a specific date (or date range).
   */
  static async getDaybook(
    tenantId: string,
    range: DateRange,
    filters: { method?: string },
  ) {
    const match: any = {
      tenantId,
      paymentDate: { $gte: range.startDate, $lte: range.endDate },
    };

    if (filters.method) match.method = filters.method;

    const payments = await Payment.find(match).sort({ paymentDate: -1 }).lean();

    if (payments.length === 0) {
      return {
        items: [],
        total: 0,
        totalAmount: 0,
        byMethod: {},
      };
    }

    // Enrich with student info
    const studentIds = [...new Set(payments.map(p => p.studentId))];
    const students = await Student.find({
      tenantId,
      _id: { $in: studentIds },
    })
      .select('firstName lastName rollNo grade section admissionNo')
      .lean();

    const studentMap = new Map(
      students.map(s => [s._id.toString(), s]),
    );

    // Enrich with invoice numbers
    const invoiceIds = [...new Set(payments.map(p => p.invoiceId))];
    const invoices = await Invoice.find({
      tenantId,
      _id: { $in: invoiceIds },
    })
      .select('invoiceNumber')
      .lean();

    const invoiceMap = new Map(
      invoices.map(i => [i._id.toString(), i.invoiceNumber]),
    );

    const items = payments.map(p => {
      const student = studentMap.get(p.studentId);
      return {
        _id: p._id.toString(),
        receiptNumber: p.receiptNumber,
        invoiceNumber: invoiceMap.get(p.invoiceId) || '—',
        studentName: student
          ? `${student.firstName} ${student.lastName}`.trim()
          : 'Unknown',
        rollNo: student?.rollNo || '—',
        grade: student?.grade || '—',
        section: student?.section || '',
        amount: p.amount,
        method: p.method,
        reference: p.reference || '',
        paymentDate: p.paymentDate,
        notes: p.notes || '',
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    const byMethod: Record<string, { amount: number; count: number }> = {};
    for (const item of items) {
      if (!byMethod[item.method]) byMethod[item.method] = { amount: 0, count: 0 };
      byMethod[item.method].amount += item.amount;
      byMethod[item.method].count += 1;
    }

    return {
      items,
      total: items.length,
      totalAmount,
      byMethod,
    };
  }

  /**
   * Student fee history: all invoices + payments for one student.
   */
  static async getStudentFeeHistory(
    tenantId: string,
    studentId: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError('Invalid student ID', 400);
    }

    const student = await Student.findOne({
      _id: studentId,
      tenantId,
      isDeleted: false,
    }).lean();

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    const invoices = await Invoice.find({
      tenantId,
      studentId,
    })
      .sort({ issuedDate: -1 })
      .lean();

    const invoiceIds = invoices.map(inv => inv._id.toString());

    const payments = await Payment.find({
      tenantId,
      invoiceId: { $in: invoiceIds },
    })
      .sort({ paymentDate: -1 })
      .lean();

    // Aggregate totals
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

    const invoiceNumberMap = new Map(
      invoices.map(inv => [inv._id.toString(), inv.invoiceNumber]),
    );

    const studentObj = {
      _id: student._id.toString(),
      firstName: student.firstName,
      lastName: student.lastName,
      admissionNo: student.admissionNo,
      rollNo: student.rollNo,
      grade: student.grade,
      section: student.section || '',
      guardianName: student.guardians?.[0]?.name || '',
      guardianPhone: student.guardians?.[0]?.phone || '',
    };

    return {
      student: studentObj,
      summary: {
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        invoiceCount: invoices.length,
        paymentCount: payments.length,
      },
      invoices: invoices.map(inv => ({
        _id: inv._id.toString(),
        invoiceNumber: inv.invoiceNumber,
        total: inv.total,
        paidAmount: inv.paidAmount,
        balanceDue: inv.balanceDue,
        status: inv.status,
        issuedDate: inv.issuedDate,
        dueDate: inv.dueDate,
      })),
      payments: payments.map(p => ({
        _id: p._id.toString(),
        receiptNumber: p.receiptNumber,
        invoiceNumber: invoiceNumberMap.get(p.invoiceId) || '—',
        amount: p.amount,
        method: p.method,
        reference: p.reference || '',
        paymentDate: p.paymentDate,
      })),
    };
  }
}