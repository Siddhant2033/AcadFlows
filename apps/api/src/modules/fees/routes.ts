import { Router } from 'express';
import { FeeController } from './controller';
import { FeeReportsController } from './reports.controller';
import { FeeExportController } from './export.controller';
import { FeeBulkController } from './bulk.controller';
import { authenticate, requireRole, ensureTenantMatch } from '../../middleware/auth';

const router: Router = Router();

router.use(authenticate);
router.use(ensureTenantMatch);

// ── Bulk operations (must come before /invoices/:id) ──
router.post(
  '/invoices/bulk-generate',
  requireRole('admin'),
  FeeBulkController.bulkGenerateInvoices,
);
router.post(
  '/reminders/bulk-send',
  requireRole('admin'),
  FeeBulkController.bulkSendReminders,
);

// ── Reports ──
router.get(
  '/reports/collection',
  requireRole('admin'),
  FeeReportsController.getCollection,
);
router.get(
  '/reports/defaulters',
  requireRole('admin'),
  FeeReportsController.getDefaulters,
);
router.get(
  '/reports/daybook',
  requireRole('admin'),
  FeeReportsController.getDaybook,
);
router.get(
  '/reports/students/:studentId/fees',
  FeeReportsController.getStudentFeeHistory,
);

// ── Exports ──
router.get(
  '/invoices/export',
  requireRole('admin'),
  FeeExportController.exportInvoices,
);
router.get(
  '/payments/export',
  requireRole('admin'),
  FeeExportController.exportPayments,
);

// ── Fee Structures ──
router.get('/structures', FeeController.getFeeStructures);
router.post('/structures', requireRole('admin'), FeeController.createFeeStructure);
router.get('/structures/:id', FeeController.getFeeStructureById);
router.put('/structures/:id', requireRole('admin'), FeeController.updateFeeStructure);
router.delete('/structures/:id', requireRole('admin'), FeeController.deleteFeeStructure);

// ── Invoices ──
router.get('/invoices', FeeController.getInvoices);
router.post('/invoices', requireRole('admin'), FeeController.generateInvoice);
router.get('/invoices/:id', FeeController.getInvoiceById);
router.put('/invoices/:id/status', requireRole('admin'), FeeController.updateInvoiceStatus);

// ── Payments ──
router.get('/payments', FeeController.getPayments);
router.post('/payments', requireRole('admin'), FeeController.recordPayment);
router.get('/payments/:id', FeeController.getPaymentById);

// ── Discounts ──
router.get('/discounts', FeeController.getDiscounts);
router.post('/discounts', requireRole('admin'), FeeController.createDiscount);
router.get('/discounts/validate/:code', FeeController.validateDiscount);
router.put('/discounts/:id', requireRole('admin'), FeeController.updateDiscount);
router.delete('/discounts/:id', requireRole('admin'), FeeController.deleteDiscount);

// ── Legacy + Reports ──
router.get('/reports', requireRole('admin'), FeeController.getFeeReport);
router.get('/students/:studentId/summary', FeeController.getStudentFeeSummary);
router.post('/reminders', requireRole('admin'), FeeController.sendReminders);

export default router;