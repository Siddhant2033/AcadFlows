import { Router } from 'express';
import { DocumentsController } from './controller';
import { CertificatesController } from './certificates.controller';
import { AuditLogController } from './audit-log.controller';
import { authenticate, requireRole, ensureTenantMatch } from '../../middleware/auth';

const router: Router = Router();

router.use(authenticate);
router.use(ensureTenantMatch);

// ── ID Cards ──
router.get(
  '/id-cards/students',
  requireRole('admin', 'teacher'),
  DocumentsController.studentIdCards,
);
router.get(
  '/id-cards/teachers',
  requireRole('admin'),
  DocumentsController.teacherIdCards,
);

// ── Certificates ──
router.get(
  '/certificates/bulk/:type',
  requireRole('admin'),
  CertificatesController.bulkGenerate,
);
router.get(
  '/certificates/:type/:studentId',
  requireRole('admin'),
  CertificatesController.generate,
);

// ── Audit Log ──
router.get('/audit-log', requireRole('admin'), AuditLogController.list);
router.get('/audit-log/filters', requireRole('admin'), AuditLogController.filters);

export default router;