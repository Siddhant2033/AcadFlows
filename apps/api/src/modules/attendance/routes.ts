import { Router } from 'express';
import { AttendanceController } from './controller';
import { authenticate, requireRole, ensureTenantMatch } from '../../middleware/auth';
import { requireClassTeacherOrAdmin } from '../../middleware/class-teacher';

const router: Router = Router();

router.use(authenticate);
router.use(ensureTenantMatch);

// ─────────────── Mark attendance ───────────────
// Class teacher of that section OR admin
router.post(
  '/students',
  requireRole('admin', 'teacher'),
  requireClassTeacherOrAdmin(),
  AttendanceController.markStudentAttendance,
);

// Admin-only: teachers attendance
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
// Class teacher of that section OR admin
router.get(
  '/sections/:sectionId/report',
  requireRole('admin', 'teacher'),
  requireClassTeacherOrAdmin(),
  AttendanceController.getSectionReport,
);

// ─────────────── Holiday ───────────────
router.post('/holiday', requireRole('admin'), AttendanceController.markHoliday);

// ─────────────── Stats ───────────────
router.get('/stats', AttendanceController.getStats);

export default router;