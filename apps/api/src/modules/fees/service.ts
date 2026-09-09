import mongoose from 'mongoose';
import { FeeStructure, Invoice, Payment, Discount, FeeReminder } from '../../models/Fee';
import { Student } from '../../models/Student';
import { User } from '../../models/User';
import { AppError } from '../../middleware/error-handler';

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
      { new: true, runValidators: true }
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
      // Validate student
      const student = await Student.findOne({
        _id: data.studentId,
        tenantId,
        isDeleted: false,
      });

      if (!student) {
        throw new AppError('Student not found', 404);
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(tenantId);

      // Calculate totals
      const items = data.items.map((item: any) => ({
        ...item,
        total: item.amount * (item.quantity || 1),
      }));

      const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
      
      // Apply discount if provided
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

          // Increment usage count
          discount.usedCount += 1;
          await discount.save({ session });
        }
      }

      const total = subtotal - discountAmount;

      const invoice = await Invoice.create([{
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
      }], { session });

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
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    const query: any = { tenantId };

    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.status) query.status = filters.status;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('studentId', 'firstName lastName rollNo grade section')
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(query),
    ]);

    return {
      items: invoices,
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

    const invoice = await Invoice.findById(id)
      .populate('studentId', 'firstName lastName rollNo grade section')
      .populate('createdBy', 'firstName lastName email');

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

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
      { new: true }
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
      // Validate invoice
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

      // Validate payment amount
      if (data.amount > invoice.balanceDue) {
        throw new AppError(`Payment amount exceeds balance due (${invoice.balanceDue})`, 400);
      }

      // Generate receipt number
      const receiptNumber = await this.generateReceiptNumber(tenantId);

      // Create payment
      const payment = await Payment.create([{
        tenantId,
        studentId: invoice.studentId,
        receiptNumber,
        paymentDate: new Date(),
        createdBy: data.createdBy,
        ...data,
      }], { session });

      // Update invoice
      const newPaidAmount = invoice.paidAmount + data.amount;
      const newBalanceDue = invoice.total - newPaidAmount;
      
      let newStatus: string = invoice.status;
      if (newBalanceDue <= 0) {
        newStatus = 'paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'partially_paid';
      }

      await Invoice.findByIdAndUpdate(
        invoice._id,
        {
          $set: {
            paidAmount: newPaidAmount,
            balanceDue: newBalanceDue,
            status: newStatus,
            paidAt: newBalanceDue <= 0 ? new Date() : invoice.paidAt,
            paymentMethod: data.method,
            paymentReference: data.reference,
          },
        },
        { session }
      );

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
    }
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

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('studentId', 'firstName lastName rollNo')
        .populate('invoiceId', 'invoiceNumber total')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query),
    ]);

    return {
      items: payments,
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

    const payment = await Payment.findById(id)
      .populate('studentId', 'firstName lastName rollNo')
      .populate('invoiceId', 'invoiceNumber total items');

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

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
      { new: true, runValidators: true }
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
    filters?: {
      gradeId?: string;
      sectionId?: string;
    }
  ) {
    const matchQuery: any = {
      tenantId,
      academicYearId,
    };

    if (filters?.gradeId) {
      // Get students in this grade
      const students = await Student.find({
        tenantId,
        grade: filters.gradeId,
        isDeleted: false,
      }).select('_id');
      
      matchQuery.studentId = { $in: students.map(s => s._id) };
    }

    // Get all invoices
    const invoices = await Invoice.find(matchQuery);

    // Calculate totals
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
    const totalDue = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const partiallyPaidInvoices = invoices.filter(inv => inv.status === 'partially_paid').length;
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;

    // Get payment summary
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
    // Find overdue invoices
    const overdueInvoices = await Invoice.find({
      tenantId,
      status: { $in: ['sent', 'partially_paid'] },
      dueDate: { $lt: new Date() },
      balanceDue: { $gt: 0 },
    }).populate('studentId', 'firstName lastName guardians');

    const reminders = [];

    for (const invoice of overdueInvoices) {
      // Get student's guardians
      const student = await Student.findById(invoice.studentId);
      if (!student || !student.guardians || student.guardians.length === 0) continue;

      // Create reminder record
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

      // Log reminder (in production, send actual emails/SMS)
      console.log(`📧 Reminder sent for invoice ${invoice.invoiceNumber}`);
      console.log(`   Student: ${student.firstName} ${student.lastName}`);
      console.log(`   Due Date: ${invoice.dueDate.toISOString().split('T')[0]}`);
      console.log(`   Amount Due: ${invoice.balanceDue}`);
      console.log(`   Guardian: ${student.guardians[0].name} (${student.guardians[0].phone})`);
    }

    return reminders;
  }

  // ============ Helper Functions ============

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

  // Get student fee summary
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
    const pendingInvoices = invoices.filter(inv => 
      inv.status === 'sent' || inv.status === 'partially_paid'
    ).length;
    const overdueInvoices = invoices.filter(inv => 
      (inv.status === 'sent' || inv.status === 'partially_paid') && 
      inv.dueDate < new Date()
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