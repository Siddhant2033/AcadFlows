import { Router } from 'express';
import { TeacherController } from './controller';
import { TeacherExportController } from './export.controller';
import { TeacherApprovalsController } from './me-approvals.controller';
import { authenticate, requireRole, ensureTenantMatch } from '../../middleware/auth';
import multer from 'multer';

const router: Router = Router();

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

// Current user's teacher profile
router.get('/me', TeacherController.getCurrentTeacher);

// ─── Teacher self-service approvals — MUST come before /:teacherId ───
router.get(
  '/me/pending-students',
  requireRole('teacher'),
  TeacherApprovalsController.listPendingStudents,
);
router.get(
  '/me/pending-guardians',
  requireRole('teacher'),
  TeacherApprovalsController.listPendingGuardians,
);
router.get(
  '/me/class-roster',
  requireRole('teacher'),
  TeacherApprovalsController.getClassRoster,
);
router.get(
  '/me/pending-counts',
  requireRole('teacher'),
  TeacherApprovalsController.getPendingCounts,
);

router.post(
  '/me/students/:studentId/approve',
  requireRole('teacher'),
  TeacherApprovalsController.approveStudent,
);
router.post(
  '/me/students/:studentId/reject',
  requireRole('teacher'),
  TeacherApprovalsController.rejectStudent,
);
router.post(
  '/me/guardians/:guardianId/approve',
  requireRole('teacher'),
  TeacherApprovalsController.approveGuardian,
);
router.post(
  '/me/guardians/:guardianId/reject',
  requireRole('teacher'),
  TeacherApprovalsController.rejectGuardian,
);

// Teacher CRUD
router.get('/', requireRole('admin'), TeacherController.getTeachers);
router.get('/stats', requireRole('admin'), TeacherController.getStats);
router.post('/', requireRole('admin'), TeacherController.createTeacher);

// ⚠️ Export MUST come before /:teacherId
router.get('/export', requireRole('admin'), TeacherExportController.export);

// Leaves
router.get(
  '/leaves/pending-count',
  requireRole('admin'),
  TeacherController.getPendingLeaveCount,
);
router.get('/leaves', requireRole('admin'), TeacherController.getLeaves);
router.get('/leaves/:leaveId', requireRole('admin'), TeacherController.getLeaveById);
router.put(
  '/leaves/:leaveId/status',
  requireRole('admin'),
  TeacherController.updateLeaveStatus,
);
router.delete('/leaves/:leaveId', requireRole('admin'), TeacherController.deleteLeave);

// Teacher-specific
router.get('/:teacherId', TeacherController.getTeacherById);
router.put('/:teacherId', requireRole('admin'), TeacherController.updateTeacher);
router.delete('/:teacherId', requireRole('admin'), TeacherController.deleteTeacher);

router.post('/:teacherId/subjects', requireRole('admin'), TeacherController.assignSubject);
router.delete(
  '/:teacherId/subjects/:subjectId/sections/:sectionId',
  requireRole('admin'),
  TeacherController.removeSubject,
);

router.get('/:teacherId/schedule', TeacherController.getSchedule);
router.get('/:teacherId/leaves', TeacherController.getLeaves);
router.post('/:teacherId/leaves', TeacherController.createLeave);
router.get('/:teacherId/leaves/balance', TeacherController.getLeaveBalance);

router.post(
  '/:teacherId/documents',
  requireRole('admin'),
  upload.single('document'),
  (_req, res) => {
    res.json({ success: true, message: 'Document upload coming soon' });
  },
);

export default router;