import { Router } from 'express';
import { PlatformController } from './controller';
import { authenticate } from '../../middleware/auth';
import { requirePlatformAdmin } from '../../middleware/platform-admin';

const router: Router = Router();

// All platform routes require auth + platform admin check
router.use(authenticate);
router.use(requirePlatformAdmin);

/* ── Dashboard stats ── */
router.get('/stats', PlatformController.getStats);
router.get('/recent-activity', PlatformController.getRecentActivity);

/* ── Schools ── */
router.get('/schools', PlatformController.listSchools);
router.get('/schools/pending', PlatformController.listPendingSchools);
router.get('/schools/:tenantId', PlatformController.getSchoolById);
router.post('/schools/:tenantId/approve', PlatformController.approveSchool);
router.post('/schools/:tenantId/reject', PlatformController.rejectSchool);
router.post('/schools/:tenantId/suspend', PlatformController.suspendSchool);
router.post('/schools/:tenantId/reactivate', PlatformController.reactivateSchool);
router.delete('/schools/:tenantId', PlatformController.deleteSchool);

/* ── Users (cross-tenant) ── */
router.get('/users', PlatformController.listUsers);
router.get('/users/:userId', PlatformController.getUserById);
router.post('/users/:userId/approve', PlatformController.approveUser);
router.post('/users/:userId/reject', PlatformController.rejectUser);
router.post('/users/:userId/suspend', PlatformController.suspendUser);
router.post('/users/:userId/reactivate', PlatformController.reactivateUser);

/* ── Pending counts (for sidebar badges) ── */
router.get('/pending-counts', PlatformController.getPendingCounts);

export default router;