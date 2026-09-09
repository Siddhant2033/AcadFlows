import { Router } from 'express';
import { StudentController } from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import multer from 'multer';

const router: Router = Router();

// Configure multer BEFORE using it
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

// Protected routes - require authentication
router.use(authenticate);

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

// Documents - FIX: Move upload.single BEFORE the route handler
router.post(
  '/:studentId/documents',
  requireRole('admin'),
  upload.single('document'),
  StudentController.uploadDocument
);

// Bulk import
router.post('/bulk-import', requireRole('admin'), StudentController.bulkImport);

export default router;