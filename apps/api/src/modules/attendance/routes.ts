import { Router } from 'express';
import { AttendanceController } from './controller';
import { authenticate, requireRole, ensureTenantMatch } from '../../middleware/auth';
import { requireClassTeacherOrAdmin } from '../../middleware/class-teacher';

const router: Router = Router();

router.use(authenticate);
router.use(ensureTenantMatch);

// ─────────────── Mark student attendance ───────────────
router.post(
  '/students',
  requireRole('admin', 'teacher'),
  requireClassTeacherOrAdmin(),
  AttendanceController.markStudentAttendance,
);

// ─────────────── Mark teacher attendance ───────────────
// List all active teachers for the marking UI
router.get(
  '/teachers/list',
  requireRole('admin'),
  AttendanceController.getAllTeachersForAttendance,
);

router.post(
  '/teachers',
  requireRole('admin'),
  AttendanceController.markTeacherAttendance,
);

// ─────────────── Get attendance ───────────────
router.get('/students/:studentId', AttendanceController.getStudentAttendance);
router.get(
  '/teachers/:teacherId',
  requireRole('admin'),
  AttendanceController.getTeacherAttendance,
);

// ─────────────── Reports ───────────────
router.get(
  '/sections/:sectionId/report',
  requireRole('admin', 'teacher'),
  requireClassTeacherOrAdmin(),
  AttendanceController.getSectionReport,
);

// Teacher attendance report — must come BEFORE the /teachers/:teacherId catch-all
router.get(
  '/teachers-report',
  requireRole('admin'),
  AttendanceController.getTeacherReport,
);

// ─────────────── Holiday ───────────────
router.post('/holiday', requireRole('admin'), AttendanceController.markHoliday);

// ─────────────── Stats ───────────────
router.get('/stats', AttendanceController.getStats);

export default router;