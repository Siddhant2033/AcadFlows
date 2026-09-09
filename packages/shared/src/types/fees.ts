import { BaseEntity, TenantScoped } from './common';

export interface FeeStructure extends BaseEntity, TenantScoped {
  academicYearId: string;
  name: string;
  description?: string;
  items: FeeItem[];
  totalAmount: number;
  status: 'active' | 'inactive';
}

export interface FeeItem {
  name: string;
  amount: number;
  isOptional: boolean;
  dueDate?: Date;
}

export interface Invoice extends BaseEntity, TenantScoped {
  studentId: string;
  academicYearId: string;
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidAt?: Date;
  paymentMethod?: 'cash' | 'bank_transfer' | 'card' | 'other';
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  amount: number;
  quantity: number;
  total: number;
}

export interface Payment extends BaseEntity, TenantScoped {
  invoiceId: string;
  studentId: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'card' | 'other';
  reference?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  notes?: string;
  receiptNumber?: string;
}

export interface FeeDiscount extends BaseEntity, TenantScoped {
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  applicableTo: 'all' | 'specific_students' | 'specific_grades';
  studentIds?: string[];
  gradeIds?: string[];
  startDate: Date;
  endDate: Date;
  status: 'active' | 'inactive';
}