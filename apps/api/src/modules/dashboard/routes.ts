import { Router } from 'express';
import { DashboardController } from './controller';
import { authenticate, requireRole, ensureTenantMatch } from '../../middleware/auth';

const router: Router = Router();

router.use(ensureTenantMatch);

// All dashboard routes require authentication

router.get('/', DashboardController.getDashboardData);
router.get('/stats', DashboardController.getStats);
router.get('/recent-activity', DashboardController.getRecentActivity);
router.get('/students', DashboardController.getStudents);
router.get('/teachers', DashboardController.getTeachers);
router.get('/classes', DashboardController.getClasses);

export default router;