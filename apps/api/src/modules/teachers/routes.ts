import { Router } from 'express';
import { TeacherController } from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import multer from 'multer';

const router: Router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed') as any, false);
    }
  },
});

// Protected routes
router.use(authenticate);

// Teacher CRUD
router.get('/', requireRole('admin'), TeacherController.getTeachers);
router.get('/stats', requireRole('admin'), TeacherController.getStats);
router.post('/', requireRole('admin'), TeacherController.createTeacher);
router.get('/:teacherId', TeacherController.getTeacherById);
router.put('/:teacherId', requireRole('admin'), TeacherController.updateTeacher);
router.delete('/:teacherId', requireRole('admin'), TeacherController.deleteTeacher);

// Subject assignments
router.post('/:teacherId/subjects', requireRole('admin'), TeacherController.assignSubject);
router.delete('/:teacherId/subjects/:subjectId/sections/:sectionId', requireRole('admin'), TeacherController.removeSubject);

// Schedule
router.get('/:teacherId/schedule', TeacherController.getSchedule);

// Leave Management
router.get('/:teacherId/leaves', TeacherController.getLeaves);
router.post('/:teacherId/leaves', TeacherController.createLeave);
router.get('/:teacherId/leaves/balance', TeacherController.getLeaveBalance);
router.get('/leaves/:leaveId', TeacherController.getLeaveById);
router.put('/leaves/:leaveId/status', requireRole('admin'), TeacherController.updateLeaveStatus);
router.delete('/leaves/:leaveId', requireRole('admin'), TeacherController.deleteLeave);

// Document upload
router.post(
  '/:teacherId/documents',
  requireRole('admin'),
  upload.single('document'),
  (req, res, next) => {
    // TODO: Implement document upload
    res.json({ success: true, message: 'Document upload coming soon' });
  }
);

export default router;