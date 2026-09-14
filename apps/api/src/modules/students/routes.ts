import { Router } from 'express';
import { StudentController } from './controller';
import { StudentExportController } from './export.controller';
import { StudentBulkController } from './bulk.controller';
import { StudentIdentityController } from './identity.controller';
import { authenticate, requireRole, ensureTenantMatch } from '../../middleware/auth';
import multer from 'multer';

const router: Router = Router();

/* ─────────────────────────────────────────────────────────────
   PUBLIC ROUTES — must come BEFORE router.use(authenticate)
   ───────────────────────────────────────────────────────────── */

router.get('/tenant/:tenantId', StudentController.getStudentsByTenant);
router.post('/verify-rollno', StudentController.verifyRollNo);
router.post('/verify-identity', StudentIdentityController.verifyIdentity);

/* ─────────────────────────────────────────────────────────────
   Protected routes — everything below requires auth + tenant
   ───────────────────────────────────────────────────────────── */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images and PDFs are allowed') as any, false);
  },
});

router.use(authenticate);
router.use(ensureTenantMatch);

router.get('/me', StudentController.getCurrentStudent);

// ── Bulk operations (must come before /:studentId) ──
router.post(
  '/bulk-promote',
  requireRole('admin'),
  StudentBulkController.bulkPromote,
);
router.post(
  '/bulk-transfer',
  requireRole('admin'),
  StudentBulkController.bulkTransfer,
);

// Exports
router.get('/export', requireRole('admin'), StudentExportController.export);

// CRUD
router.get('/', StudentController.getStudents);
router.get('/search', StudentController.searchStudents);
router.get('/stats', StudentController.getStats);
router.post('/', requireRole('admin'), StudentController.createStudent);
router.get('/:studentId', StudentController.getStudentById);
router.put('/:studentId', requireRole('admin'), StudentController.updateStudent);
router.delete('/:studentId', requireRole('admin'), StudentController.deleteStudent);

router.post('/:studentId/enroll', requireRole('admin'), StudentController.enrollStudent);
router.post('/:studentId/withdraw', requireRole('admin'), StudentController.withdrawStudent);

router.post(
  '/:studentId/documents',
  requireRole('admin'),
  upload.single('document'),
  StudentController.uploadDocument,
);

router.post('/bulk-import', requireRole('admin'), StudentController.bulkImport);

export default router;