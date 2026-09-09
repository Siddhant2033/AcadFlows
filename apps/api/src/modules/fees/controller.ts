import { Request, Response, NextFunction } from 'express';
import { FeeService } from './service';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';

class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

// Validation Schemas
const feeStructureSchema = z.object({
  academicYearId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  gradeId: z.string().optional(),
  studentType: z.enum(['all', 'new', 'existing']).default('all'),
  items: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    amount: z.number().min(0),
    isOptional: z.boolean().default(false),
    dueDate: z.string().transform(str => new Date(str)).optional(),
    category: z.enum(['tuition', 'admission', 'exam', 'transport', 'library', 'sports', 'other']).default('other'),
  })),
  isActive: z.boolean().default(true),
});

const invoiceSchema = z.object({
  studentId: z.string().min(1),
  academicYearId: z.string().min(1),
  items: z.array(z.object({
    description: z.string().min(1),
    amount: z.number().min(0),
    quantity: z.number().min(1).default(1),
    category: z.string().optional(),
    dueDate: z.string().transform(str => new Date(str)).optional(),
  })),
  dueDate: z.string().transform(str => new Date(str)),
  notes: z.string().optional(),
  discountCode: z.string().optional(),
});

const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().min(0.01),
  method: z.enum(['cash', 'bank_transfer', 'card', 'cheque', 'online', 'other']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const discountSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0),
  applicableTo: z.enum(['all', 'specific_students', 'specific_grades']).default('all'),
  studentIds: z.array(z.string()).optional(),
  gradeIds: z.array(z.string()).optional(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)).optional(),
  maxUses: z.number().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export class FeeController {
  // ============ Fee Structure ============
  
  static async createFeeStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = feeStructureSchema.parse(req.body);

      const structure = await FeeService.createFeeStructure(
        authReq.user.tenantId,
        validated
      );

      res.status(201).json({
        success: true,
        data: structure,
        message: 'Fee structure created successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFeeStructures(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { academicYearId, isActive } = req.query;

      const structures = await FeeService.getFeeStructures(
        authReq.user.tenantId,
        academicYearId as string,
        isActive === 'true'
      );

      res.json({
        success: true,
        data: structures,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFeeStructureById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const structure = await FeeService.getFeeStructureById(id);

      res.json({
        success: true,
        data: structure,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateFeeStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = feeStructureSchema.partial().parse(req.body);

      const structure = await FeeService.updateFeeStructure(id, validated);

      res.json({
        success: true,
        data: structure,
        message: 'Fee structure updated successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteFeeStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await FeeService.deleteFeeStructure(id);

      res.json({
        success: true,
        message: 'Fee structure deleted successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Invoices ============

  static async generateInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = invoiceSchema.parse(req.body);

      const invoice = await FeeService.generateInvoice(
        authReq.user.tenantId,
        {
          ...validated,
          createdBy: authReq.user.id,
        }
      );

      res.status(201).json({
        success: true,
        data: invoice,
        message: 'Invoice generated successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { studentId, status, startDate, endDate, page, limit } = req.query;

      const result = await FeeService.getInvoices(
        authReq.user.tenantId,
        {
          studentId: studentId as string,
          status: status as string,
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
        }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInvoiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const invoice = await FeeService.getInvoiceById(id);

      res.json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateInvoiceStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        throw new AppError('Status is required', 400);
      }

      const invoice = await FeeService.updateInvoiceStatus(id, status);

      res.json({
        success: true,
        data: invoice,
        message: `Invoice status updated to ${status}!`,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Payments ============

  static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = paymentSchema.parse(req.body);

      const payment = await FeeService.recordPayment(
        authReq.user.tenantId,
        {
          ...validated,
          createdBy: authReq.user.id,
        }
      );

      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment recorded successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { studentId, invoiceId, startDate, endDate, page, limit } = req.query;

      const result = await FeeService.getPayments(
        authReq.user.tenantId,
        {
          studentId: studentId as string,
          invoiceId: invoiceId as string,
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
        }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payment = await FeeService.getPaymentById(id);

      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Discounts ============

  static async createDiscount(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = discountSchema.parse(req.body);

      const discount = await FeeService.createDiscount(
        authReq.user.tenantId,
        validated
      );

      res.status(201).json({
        success: true,
        data: discount,
        message: 'Discount created successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDiscounts(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { isActive } = req.query;

      const discounts = await FeeService.getDiscounts(
        authReq.user.tenantId,
        isActive === 'true' ? true : isActive === 'false' ? false : undefined
      );

      res.json({
        success: true,
        data: discounts,
      });
    } catch (error) {
      next(error);
    }
  }

  static async validateDiscount(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { code } = req.params;

      const discount = await FeeService.getDiscountByCode(
        authReq.user.tenantId,
        code
      );

      res.json({
        success: true,
        data: discount,
        message: 'Discount code is valid!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateDiscount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = discountSchema.partial().parse(req.body);

      const discount = await FeeService.updateDiscount(id, validated);

      res.json({
        success: true,
        data: discount,
        message: 'Discount updated successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteDiscount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await FeeService.deleteDiscount(id);

      res.json({
        success: true,
        message: 'Discount deleted successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Reports ============

  static async getFeeReport(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { academicYearId, gradeId, sectionId } = req.query;

      if (!academicYearId) {
        throw new AppError('Academic Year ID is required', 400);
      }

      const report = await FeeService.getFeeReport(
        authReq.user.tenantId,
        academicYearId as string,
        {
          gradeId: gradeId as string,
          sectionId: sectionId as string,
        }
      );

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Student Fee Summary ============

  static async getStudentFeeSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { studentId } = req.params;

      const summary = await FeeService.getStudentFeeSummary(
        authReq.user.tenantId,
        studentId
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============ Reminders ============

  static async sendReminders(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;

      const reminders = await FeeService.sendPaymentReminders(
        authReq.user.tenantId
      );

      res.json({
        success: true,
        data: reminders,
        message: `${reminders.length} reminders sent successfully!`,
      });
    } catch (error) {
      next(error);
    }
  }
}