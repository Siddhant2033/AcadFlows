import { Router } from 'express';
import { DashboardController } from './controller';

const router: Router = Router();

// Authentication + tenant match are applied at the app level in app.ts.
// See: app.use('/api/v1/dashboard', authenticate, ensureTenantMatch, dashboardRoutes)

router.get('/', DashboardController.getDashboardData);
router.get('/stats', DashboardController.getStats);
router.get('/recent-activity', DashboardController.getRecentActivity);
router.get('/students', DashboardController.getStudents);
router.get('/teachers', DashboardController.getTeachers);
router.get('/classes', DashboardController.getClasses);

export default router;