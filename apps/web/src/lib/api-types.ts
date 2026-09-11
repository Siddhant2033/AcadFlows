/**
 * Shared types for the fee reports endpoints.
 * These mirror the backend response shapes.
 */

export interface FeeCollectionReport {
  range: { startDate: string; endDate: string };
  summary: {
    totalInvoiced: number;
    totalCollected: number;
    totalOutstanding: number;
    totalDiscount: number;
    collectionRate: number;
    invoiceCount: number;
  };
  statusBreakdown: {
    paid: number;
    partially_paid: number;
    overdue: number;
    draft: number;
  };
  dailyCollections: { date: string; amount: number; count: number }[];
  byMethod: { method: string; amount: number; count: number }[];
}

export interface DefaulterItem {
  studentId: string;
  admissionNo: string;
  rollNo: string;
  name: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  sectionId: string | null;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  dueAmount: number;
}

export interface DefaultersReport {
  items: DefaulterItem[];
  total: number;
  totalOutstanding: number;
}

export interface DaybookItem {
  _id: string;
  receiptNumber: string;
  invoiceNumber: string;
  studentName: string;
  rollNo: string;
  grade: string;
  section: string;
  amount: number;
  method: string;
  reference: string;
  paymentDate: string;
  notes: string;
}

export interface DaybookReport {
  items: DaybookItem[];
  total: number;
  totalAmount: number;
  byMethod: Record<string, { amount: number; count: number }>;
}

export interface StudentFeeHistory {
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    admissionNo: string;
    rollNo: string;
    grade: string;
    section: string;
    guardianName: string;
    guardianPhone: string;
  };
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    invoiceCount: number;
    paymentCount: number;
  };
  invoices: {
    _id: string;
    invoiceNumber: string;
    total: number;
    paidAmount: number;
    balanceDue: number;
    status: string;
    issuedDate: string;
    dueDate: string;
  }[];
  payments: {
    _id: string;
    receiptNumber: string;
    invoiceNumber: string;
    amount: number;
    method: string;
    reference: string;
    paymentDate: string;
  }[];
}