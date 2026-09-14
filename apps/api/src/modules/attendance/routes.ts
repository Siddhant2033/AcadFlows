import { Router } from 'express';
import { AttendanceController } from './controller';
import { AttendanceWarningsController } from './warnings.controller';
import { requireRole } from '../../middleware/auth';
import { requireClassTeacherOrAdmin } from '../../middleware/class-teacher';

const router: Router = Router();

// Authentication + tenant match are applied at the app level in app.ts.
// See: app.use('/api/v1/attendance', authenticate, ensureTenantMatch, attendanceRoutes);

/* ─────────────────────────────────────────────────────────────
   Warnings — must be mounted BEFORE /:something routes
   ───────────────────────────────────────────────────────────── */
router.get(
  '/warnings/export',
  requireRole('admin'),
  AttendanceWarningsController.exportWarnings,
);
router.get(
  '/warnings',
  requireRole('admin', 'teacher'),
  AttendanceWarningsController.getWarnings,
);

/* ─────────────────────────────────────────────────────────────
   Teacher-specific — before /:teacherId
   ───────────────────────────────────────────────────────────── */
router.get(
  '/teachers/list',
  requireRole('admin'),
  AttendanceController.getAllTeachersForAttendance,
);
router.get(
  '/teachers-report',
  requireRole('admin'),
  AttendanceController.getTeacherReport,
);

/* ─────────────────────────────────────────────────────────────
   Mark attendance
   ───────────────────────────────────────────────────────────── */
router.post(
  '/students',
  requireRole('admin', 'teacher'),
  requireClassTeacherOrAdmin(),
  AttendanceController.markStudentAttendance,
);

router.post(
  '/teachers',
  requireRole('admin'),
  AttendanceController.markTeacherAttendance,
);

/* ─────────────────────────────────────────────────────────────
   Section reports — before /:sectionId catch-all
   ───────────────────────────────────────────────────────────── */
router.get(
  '/sections/:sectionId/report',
  requireRole('admin', 'teacher'),
  requireClassTeacherOrAdmin(),
  AttendanceController.getSectionReport,
);
router.get(
  '/sections/:sectionId/export',
  requireRole('admin', 'teacher'),
  requireClassTeacherOrAdmin(),
  AttendanceWarningsController.exportSectionAttendance,
);

/* ─────────────────────────────────────────────────────────────
   Dynamic routes — LAST
   ───────────────────────────────────────────────────────────── */
router.get('/students/:studentId', AttendanceController.getStudentAttendance);
router.get(
  '/teachers/:teacherId',
  requireRole('admin'),
  AttendanceController.getTeacherAttendance,
);

/* ─────────────────────────────────────────────────────────────
   Holiday + stats
   ───────────────────────────────────────────────────────────── */
router.post('/holiday', requireRole('admin'), AttendanceController.markHoliday);
router.get('/stats', AttendanceController.getStats);

export default router;