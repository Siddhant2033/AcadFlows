import { Router } from 'express';
import { ApprovalsController } from './controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router: Router = Router();

router.use(authenticate);

/* ── School admin approval queue ── */
router.get(
  '/pending/teachers',
  requireRole('admin'),
  ApprovalsController.listPendingTeachers,
);

router.get(
  '/pending/students',
  requireRole('admin'),
  ApprovalsController.listPendingStudents,
);

router.get(
  '/pending/guardians',
  requireRole('admin'),
  ApprovalsController.listPendingGuardians,
);

/* ── Counts (sidebar badges) ── */
router.get(
  '/pending-counts',
  requireRole('admin'),
  ApprovalsController.getPendingCounts,
);

/* ── Actions (approve/reject) ── */
router.post(
  '/teachers/:teacherId/approve',
  requireRole('admin'),
  ApprovalsController.approveTeacher,
);

router.post(
  '/teachers/:teacherId/reject',
  requireRole('admin'),
  ApprovalsController.rejectTeacher,
);

router.post(
  '/students/:studentId/approve',
  requireRole('admin'),
  ApprovalsController.approveStudent,
);

router.post(
  '/students/:studentId/reject',
  requireRole('admin'),
  ApprovalsController.rejectStudent,
);

router.post(
  '/guardians/:userId/approve',
  requireRole('admin'),
  ApprovalsController.approveGuardian,
);

router.post(
  '/guardians/:userId/reject',
  requireRole('admin'),
  ApprovalsController.rejectGuardian,
);

export default router;