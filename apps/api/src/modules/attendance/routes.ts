import { Router } from 'express';
import { AttendanceController } from './controller';
import { AttendanceWarningsController } from './warnings.controller';
import { authenticate, requireRole, ensureTenantMatch } from '../../middleware/auth';
import { requireClassTeacherOrAdmin } from '../../middleware/class-teacher';

const router: Router = Router();

router.use(authenticate);
router.use(ensureTenantMatch);

// ── Warnings ──
router.get(
  '/warnings',
  requireRole('admin', 'teacher'),
  AttendanceWarningsController.getWarnings,
);
router.get(
  '/warnings/export',
  requireRole('admin'),
  AttendanceWarningsController.exportWarnings,
);

// ── Mark student attendance ──
router.post(
  '/students',
  requireRole('admin', 'teacher'),
  requireClassTeacherOrAdmin(),
  AttendanceController.markStudentAttendance,
);

// ── Teachers ──
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

// ── Get attendance ──
router.get('/students/:studentId', AttendanceController.getStudentAttendance);
router.get(
  '/teachers/:teacherId',
  requireRole('admin'),
  AttendanceController.getTeacherAttendance,
);

// ── Reports ──
router.get(
  '/sections/:sectionId/report',
  requireRole('admin', 'teacher'),
  requireClassTeacherOrAdmin(),
  AttendanceController.getSectionReport,
);

// CSV export for a section
router.get(
  '/sections/:sectionId/export',
  requireRole('admin', 'teacher'),
  requireClassTeacherOrAdmin(),
  AttendanceWarningsController.exportSectionAttendance,
);

router.get(
  '/teachers-report',
  requireRole('admin'),
  AttendanceController.getTeacherReport,
);

// ── Holiday ──
router.post('/holiday', requireRole('admin'), AttendanceController.markHoliday);

// ── Stats ──
router.get('/stats', AttendanceController.getStats);

export default router;