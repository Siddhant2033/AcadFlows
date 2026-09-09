import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { DashboardController } from './controller';

const router: Router = Router();

// All dashboard routes require authentication
router.use(authenticate);

router.get('/', DashboardController.getDashboardData);
router.get('/stats', DashboardController.getStats);
router.get('/recent-activity', DashboardController.getRecentActivity);
router.get('/students', DashboardController.getStudents);
router.get('/teachers', DashboardController.getTeachers);
router.get('/classes', DashboardController.getClasses);

export default router;