import mongoose, { Schema, Document } from 'mongoose';

export interface IFeeStructure extends Document {
  tenantId: string;
  academicYearId: string;
  name: string;
  description?: string;
  gradeId?: string;
  studentType?: 'all' | 'new' | 'existing';
  items: {
    name: string;
    description?: string;
    amount: number;
    isOptional: boolean;
    dueDate?: Date;
    category: 'tuition' | 'admission' | 'exam' | 'transport' | 'library' | 'sports' | 'other';
  }[];
  totalAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvoice extends Document {
  tenantId: string;
  studentId: string;
  academicYearId: string;
  invoiceNumber: string;
  items: {
    description: string;
    amount: number;
    quantity: number;
    total: number;
    category?: string;
    dueDate?: Date;
  }[];
  subtotal: number;
  discountAmount: number;
  discountType?: 'percentage' | 'fixed';
  discountCode?: string;
  total: number;
  paidAmount: number;
  balanceDue: number;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  issuedDate: Date;
  paidAt?: Date;
  paymentMethod?: 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'online' | 'other';
  paymentReference?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment extends Document {
  tenantId: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'online' | 'other';
  reference?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  notes?: string;
  receiptNumber: string;
  paymentDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDiscount extends Document {
  tenantId: string;
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  applicableTo: 'all' | 'specific_students' | 'specific_grades';
  studentIds?: string[];
  gradeIds?: string[];
  startDate: Date;
  endDate?: Date;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeeReminder extends Document {
  tenantId: string;
  invoiceId: string;
  studentId: string;
  type: 'email' | 'sms' | 'both';
  sentAt: Date;
  dueDate: Date;
  amount: number;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  createdAt: Date;
}

// Fee Structure Schema
const feeStructureSchema = new Schema<IFeeStructure>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    academicYearId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    gradeId: String,
    studentType: {
      type: String,
      enum: ['all', 'new', 'existing'],
      default: 'all',
    },
    items: [{
      name: {
        type: String,
        required: true,
      },
      description: String,
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      isOptional: {
        type: Boolean,
        default: false,
      },
      dueDate: Date,
      category: {
        type: String,
        enum: ['tuition', 'admission', 'exam', 'transport', 'library', 'sports', 'other'],
        default: 'other',
      },
    }],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Invoice Schema
const invoiceSchema = new Schema<IInvoice>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    academicYearId: {
      type: String,
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    items: [{
      description: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
      category: String,
      dueDate: Date,
    }],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
    },
    discountCode: String,
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    paidAt: Date,
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'card', 'cheque', 'online', 'other'],
    },
    paymentReference: String,
    notes: String,
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Payment Schema
const paymentSchema = new Schema<IPayment>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    invoiceId: {
      type: String,
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ['cash', 'bank_transfer', 'card', 'cheque', 'online', 'other'],
      required: true,
    },
    reference: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: String,
    notes: String,
    receiptNumber: {
      type: String,
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Discount Schema
const discountSchema = new Schema<IDiscount>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    applicableTo: {
      type: String,
      enum: ['all', 'specific_students', 'specific_grades'],
      default: 'all',
    },
    studentIds: [String],
    gradeIds: [String],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    maxUses: Number,
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: String,
  },
  {
    timestamps: true,
  }
);

// Fee Reminder Schema
const feeReminderSchema = new Schema<IFeeReminder>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    invoiceId: {
      type: String,
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['email', 'sms', 'both'],
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
    },
    errorMessage: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
feeStructureSchema.index({ tenantId: 1, academicYearId: 1 });
feeStructureSchema.index({ tenantId: 1, isActive: 1 });

invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ tenantId: 1, studentId: 1, status: 1 });
invoiceSchema.index({ tenantId: 1, dueDate: 1, status: 1 });

paymentSchema.index({ tenantId: 1, receiptNumber: 1 }, { unique: true });
paymentSchema.index({ tenantId: 1, invoiceId: 1 });
paymentSchema.index({ tenantId: 1, studentId: 1, paymentDate: 1 });

discountSchema.index({ tenantId: 1, code: 1 }, { unique: true });
discountSchema.index({ tenantId: 1, isActive: 1, startDate: 1 });

feeReminderSchema.index({ tenantId: 1, invoiceId: 1 });
feeReminderSchema.index({ tenantId: 1, status: 1, dueDate: 1 });

// ─────────────────────────────────────────────────────────────
// FIXED B13: Auto-compute totals on save so they never drift.
// ─────────────────────────────────────────────────────────────

feeStructureSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }
  next();
});

invoiceSchema.pre('save', function (next) {
  // Recompute subtotal from items
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => {
      const lineTotal = (item.amount || 0) * (item.quantity || 1);
      item.total = lineTotal; // keep line total in sync
      return sum + lineTotal;
    }, 0);
  } else {
    this.subtotal = 0;
  }

  // Apply discount
  const discount = this.discountAmount || 0;
  this.total = Math.max(0, this.subtotal - discount);

  // Recompute balance
  const paid = this.paidAmount || 0;
  this.balanceDue = Math.max(0, this.total - paid);

  next();
});

export const FeeStructure = mongoose.model<IFeeStructure>('FeeStructure', feeStructureSchema);
export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
export const Discount = mongoose.model<IDiscount>('Discount', discountSchema);
export const FeeReminder = mongoose.model<IFeeReminder>('FeeReminder', feeReminderSchema);