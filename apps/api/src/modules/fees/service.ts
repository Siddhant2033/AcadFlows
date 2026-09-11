import mongoose from 'mongoose';
import { FeeStructure, Invoice, Payment, Discount, FeeReminder } from '../../models/Fee';
import { Student } from '../../models/Student';
import { User } from '../../models/User';
import { AppError } from '../../middleware/error-handler';
import { attachRefs } from '../../utils/attach-refs';

const invoiceRefs = {
  studentId: { model: Student, fields: 'firstName lastName rollNo grade section admissionNo' },
  createdBy: { model: User, fields: 'firstName lastName email' },
};

const paymentRefs = {
  studentId: { model: Student, fields: 'firstName lastName rollNo' },
  invoiceId: { model: Invoice, fields: 'invoiceNumber total' },
};

export class FeeService {
  // ============ Fee Structure ============

  static async createFeeStructure(tenantId: string, data: any) {
    const items = data.items.map((item: any) => ({
      ...item,
      amount: parseFloat(item.amount),
    }));

    const totalAmount = items.reduce((sum: number, item: any) => sum + item.amount, 0);

    const feeStructure = await FeeStructure.create({
      tenantId,
      ...data,
      items,
      totalAmount,
    });

    return feeStructure;
  }

  static async getFeeStructures(tenantId: string, academicYearId?: string, isActive?: boolean) {
    const query: any = { tenantId };
    if (academicYearId) query.academicYearId = academicYearId;
    if (isActive !== undefined) query.isActive = isActive;

    return await FeeStructure.find(query).sort({ createdAt: -1 });
  }

  static async getFeeStructureById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid fee structure ID', 400);
    }

    const structure = await FeeStructure.findById(id);
    if (!structure) {
      throw new AppError('Fee structure not found', 404);
    }

    return structure;
  }

  static async updateFeeStructure(id: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid fee structure ID', 400);
    }

    if (data.items) {
      const items = data.items.map((item: any) => ({
        ...item,
        amount: parseFloat(item.amount),
      }));
      data.totalAmount = items.reduce((sum: number, item: any) => sum + item.amount, 0);
      data.items = items;
    }

    const structure = await FeeStructure.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!structure) {
      throw new AppError('Fee structure not found', 404);
    }

    return structure;
  }

  static async deleteFeeStructure(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid fee structure ID', 400);
    }

    const structure = await FeeStructure.findByIdAndDelete(id);
    if (!structure) {
      throw new AppError('Fee structure not found', 404);
    }

    return structure;
  }

  // ============ Invoices ============

  static async generateInvoice(tenantId: string, data: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const student = await Student.findOne({
        _id: data.studentId,
        tenantId,
        isDeleted: false,
      });

      if (!student) {
        throw new AppError('Student not found', 404);
      }

      const invoiceNumber = await this.generateInvoiceNumber(tenantId);

      const items = data.items.map((item: any) => ({
        ...item,
        total: item.amount * (item.quantity || 1),
      }));

      const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);

      let discountAmount = 0;
      let discountType: 'percentage' | 'fixed' | undefined;
      let discountCode: string | undefined;

      if (data.discountCode) {
        const discount = await Discount.findOne({
          tenantId,
          code: data.discountCode.toUpperCase(),
          isActive: true,
          startDate: { $lte: new Date() },
          $or: [
            { endDate: { $gte: new Date() } },
            { endDate: { $exists: false } },
          ],
        });

        if (discount) {
          discountType = discount.type;
          discountCode = discount.code;

          if (discount.type === 'percentage') {
            discountAmount = (subtotal * discount.value) / 100;
          } else {
            discountAmount = discount.value;
          }

          discount.usedCount += 1;
          await discount.save({ session });
        }
      }

      const total = subtotal - discountAmount;

      const invoice = await Invoice.create(
        [
          {
            tenantId,
            ...data,
            invoiceNumber,
            items,
            subtotal,
            discountAmount,
            discountType,
            discountCode,
            total,
            paidAmount: 0,
            balanceDue: total,
            status: 'draft',
            issuedDate: new Date(),
            createdBy: data.createdBy,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      return invoice[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async getInvoices(
    tenantId: string,
    filters: {
      studentId?: string;
      status?: string;
      search?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    const query: any = { tenantId };

    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.status) query.status = filters.status;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    // If search, first find matching students to filter by studentIds
    if (filters.search) {
      const students = await Student.find({
        tenantId,
        $or: [
          { firstName: { $regex: filters.search, $options: 'i' } },
          { lastName: { $regex: filters.search, $options: 'i' } },
          { rollNo: { $regex: filters.search, $options: 'i' } },
          { admissionNo: { $regex: filters.search, $options: 'i' } },
        ],
      }).select('_id').lean();

      const ids = students.map(s => s._id.toString());

      query.$or = [
        { invoiceNumber: { $regex: filters.search, $options: 'i' } },
        { studentId: { $in: ids } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [rawInvoices, total] = await Promise.all([
      Invoice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(query),
    ]);

    const items = await attachRefs(rawInvoices, invoiceRefs);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getInvoiceById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid invoice ID', 400);
    }

    const raw = await Invoice.findById(id).lean();
    if (!raw) {
      throw new AppError('Invoice not found', 404);
    }

    const [invoice] = await attachRefs([raw], invoiceRefs);
    return invoice;
  }

  static async updateInvoiceStatus(id: string, status: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid invoice ID', 400);
    }

    const invoice = await Invoice.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          ...(status === 'paid' ? { paidAt: new Date() } : {}),
        },
      },
      { new: true },
    );

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    return invoice;
  }

  // ============ Payments ============

  static async recordPayment(tenantId: string, data: any) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const invoice = await Invoice.findOne({
        _id: data.invoiceId,
        tenantId,
      });

      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }

      if (invoice.status === 'paid') {
        throw new AppError('Invoice is already fully paid', 409);
      }

      if (data.amount > invoice.balanceDue) {
        throw new AppError(`Payment amount exceeds balance due (${invoice.balanceDue})`, 400);
      }

      const receiptNumber = await this.generateReceiptNumber(tenantId);

      const payment = await Payment.create(
        [
          {
            tenantId,
            studentId: invoice.studentId,
            receiptNumber,
            paymentDate: new Date(),
            createdBy: data.createdBy,
            invoiceId: data.invoiceId,
            amount: data.amount,
            method: data.method,
            reference: data.reference,
            notes: data.notes,
            status: 'completed',
          },
        ],
        { session },
      );

      invoice.paidAmount = invoice.paidAmount + data.amount;
      invoice.paymentMethod = data.method;
      invoice.paymentReference = data.reference;

      const newBalance = invoice.total - invoice.paidAmount;
      if (newBalance <= 0) {
        invoice.status = 'paid';
        invoice.paidAt = new Date();
      } else if (invoice.paidAmount > 0) {
        invoice.status = 'partially_paid';
      }

      await invoice.save({ session });

      await session.commitTransaction();
      session.endSession();

      return payment[0];
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async getPayments(
    tenantId: string,
    filters: {
      studentId?: string;
      invoiceId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    },
  ) {
    const query: any = { tenantId };

    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.invoiceId) query.invoiceId = filters.invoiceId;
    if (filters.startDate || filters.endDate) {
      query.paymentDate = {};
      if (filters.startDate) query.paymentDate.$gte = filters.startDate;
      if (filters.endDate) query.paymentDate.$lte = filters.endDate;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [rawPayments, total] = await Promise.all([
      Payment.find(query)
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);

    const items = await attachRefs(rawPayments, paymentRefs);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getPaymentById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid payment ID', 400);
    }

    const raw = await Payment.findById(id).lean();
    if (!raw) {
      throw new AppError('Payment not found', 404);
    }

    const [payment] = await attachRefs([raw], paymentRefs);
    return payment;
  }

  // ============ Discounts ============

  static async createDiscount(tenantId: string, data: any) {
    const discount = await Discount.create({
      tenantId,
      ...data,
      code: data.code.toUpperCase(),
    });

    return discount;
  }

  static async getDiscounts(tenantId: string, isActive?: boolean) {
    const query: any = { tenantId };
    if (isActive !== undefined) query.isActive = isActive;

    return await Discount.find(query).sort({ createdAt: -1 });
  }

  static async getDiscountByCode(tenantId: string, code: string) {
    const discount = await Discount.findOne({
      tenantId,
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      $or: [
        { endDate: { $gte: new Date() } },
        { endDate: { $exists: false } },
      ],
    });

    if (!discount) {
      throw new AppError('Invalid or expired discount code', 404);
    }

    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      throw new AppError('Discount code has reached its maximum usage limit', 400);
    }

    return discount;
  }

  static async updateDiscount(id: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid discount ID', 400);
    }

    if (data.code) {
      data.code = data.code.toUpperCase();
    }

    const discount = await Discount.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );

    if (!discount) {
      throw new AppError('Discount not found', 404);
    }

    return discount;
  }

  static async deleteDiscount(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid discount ID', 400);
    }

    const discount = await Discount.findByIdAndDelete(id);
    if (!discount) {
      throw new AppError('Discount not found', 404);
    }

    return discount;
  }

  // ============ Fee Reports ============

  static async getFeeReport(
    tenantId: string,
    academicYearId: string,
    filters?: { gradeId?: string; sectionId?: string },
  ) {
    const matchQuery: any = { tenantId, academicYearId };

    if (filters?.gradeId) {
      const students = await Student.find({
        tenantId,
        grade: filters.gradeId,
        isDeleted: false,
      }).select('_id');

      matchQuery.studentId = { $in: students.map(s => s._id.toString()) };
    }

    const invoices = await Invoice.find(matchQuery);

    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalDue = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const partiallyPaidInvoices = invoices.filter(inv => inv.status === 'partially_paid').length;
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;

    const payments = await Payment.aggregate([
      { $match: { tenantId } },
      {
        $group: {
          _id: '$method',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      summary: {
        totalInvoices,
        totalAmount,
        totalPaid,
        totalDue,
        collectionRate: totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0,
      },
      statusBreakdown: {
        paid: paidInvoices,
        partially_paid: partiallyPaidInvoices,
        overdue: overdueInvoices,
        draft: invoices.filter(inv => inv.status === 'draft').length,
        sent: invoices.filter(inv => inv.status === 'sent').length,
      },
      paymentMethods: payments,
      invoices,
    };
  }

  // ============ Reminders ============

  static async sendPaymentReminders(tenantId: string) {
    const overdueInvoices = await Invoice.find({
      tenantId,
      status: { $in: ['sent', 'partially_paid'] },
      dueDate: { $lt: new Date() },
      balanceDue: { $gt: 0 },
    });

    const reminders = [];

    for (const invoice of overdueInvoices) {
      const student = await Student.findById(invoice.studentId);
      if (!student || !student.guardians || student.guardians.length === 0) continue;

      const reminder = await FeeReminder.create({
        tenantId,
        invoiceId: invoice._id,
        studentId: invoice.studentId,
        type: 'email',
        dueDate: invoice.dueDate,
        amount: invoice.balanceDue,
        status: 'sent',
        sentAt: new Date(),
      });

      reminders.push(reminder);

      console.log(`📧 Reminder sent for invoice ${invoice.invoiceNumber}`);
      console.log(`   Student: ${student.firstName} ${student.lastName}`);
      console.log(`   Due Date: ${invoice.dueDate.toISOString().split('T')[0]}`);
      console.log(`   Amount Due: ${invoice.balanceDue}`);
      console.log(`   Guardian: ${student.guardians[0].name} (${student.guardians[0].phone})`);
    }

    return reminders;
  }

  // ============ Helpers ============

  private static async generateInvoiceNumber(tenantId: string): Promise<string> {
    const count = await Invoice.countDocuments({ tenantId });
    const year = new Date().getFullYear().toString().slice(-2);
    const sequence = String(count + 1).padStart(5, '0');
    return `INV-${year}-${sequence}`;
  }

  private static async generateReceiptNumber(tenantId: string): Promise<string> {
    const count = await Payment.countDocuments({ tenantId });
    const year = new Date().getFullYear().toString().slice(-2);
    const sequence = String(count + 1).padStart(5, '0');
    return `REC-${year}-${sequence}`;
  }

  static async getStudentFeeSummary(tenantId: string, studentId: string) {
    const invoices = await Invoice.find({
      tenantId,
      studentId,
      status: { $ne: 'cancelled' },
    });

    const totalDue = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);

    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const pendingInvoices = invoices.filter(
      inv => inv.status === 'sent' || inv.status === 'partially_paid',
    ).length;
    const overdueInvoices = invoices.filter(
      inv =>
        (inv.status === 'sent' || inv.status === 'partially_paid') &&
        inv.dueDate < new Date(),
    ).length;

    return {
      totalAmount,
      totalPaid,
      totalDue,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      invoices: invoices.map(inv => ({
        id: inv._id,
        invoiceNumber: inv.invoiceNumber,
        total: inv.total,
        paidAmount: inv.paidAmount,
        balanceDue: inv.balanceDue,
        status: inv.status,
        dueDate: inv.dueDate,
        issuedDate: inv.issuedDate,
      })),
    };
  }
}