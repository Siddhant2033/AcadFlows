import { Router } from 'express';
import { StudentController } from './controller';
import { authenticate, requireRole, ensureTenantMatch } from '../../middleware/auth';
import multer from 'multer';

const router: Router = Router();

// ─────────────────────────────────────────────────────────────
// Public routes — used during guardian registration, before login.
// Must be mounted BEFORE router.use(authenticate) and BEFORE the
// wildcard /:studentId route.
// ─────────────────────────────────────────────────────────────

router.get('/tenant/:tenantId', StudentController.getStudentsByTenant);
router.post('/verify-rollno', StudentController.verifyRollNo);

// ─────────────────────────────────────────────────────────────
// Protected routes
// ─────────────────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed') as any, false);
    }
  },
});

router.use(authenticate);
router.use(ensureTenantMatch);

// Student CRUD
router.get('/', StudentController.getStudents);
router.get('/search', StudentController.searchStudents);
router.get('/stats', StudentController.getStats);
router.post('/', requireRole('admin'), StudentController.createStudent);
router.get('/:studentId', StudentController.getStudentById);
router.put('/:studentId', requireRole('admin'), StudentController.updateStudent);
router.delete('/:studentId', requireRole('admin'), StudentController.deleteStudent);

// Enrollment
router.post('/:studentId/enroll', requireRole('admin'), StudentController.enrollStudent);
router.post('/:studentId/withdraw', requireRole('admin'), StudentController.withdrawStudent);

// Documents
router.post(
  '/:studentId/documents',
  requireRole('admin'),
  upload.single('document'),
  StudentController.uploadDocument,
);

// Bulk import
router.post('/bulk-import', requireRole('admin'), StudentController.bulkImport);

export default router;