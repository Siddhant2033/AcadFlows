import { Router } from 'express';
import { AttendanceController } from './controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

// Mark attendance
router.post('/students', requireRole('admin', 'teacher'), AttendanceController.markStudentAttendance);
router.post('/teachers', requireRole('admin'), AttendanceController.markTeacherAttendance);

// Get attendance
router.get('/students/:studentId', AttendanceController.getStudentAttendance);
router.get('/teachers/:teacherId', requireRole('admin'), AttendanceController.getTeacherAttendance);

// Reports
router.get('/sections/:sectionId/report', requireRole('admin', 'teacher'), AttendanceController.getSectionReport);

// Holiday
router.post('/holiday', requireRole('admin'), AttendanceController.markHoliday);

// Stats
router.get('/stats', AttendanceController.getStats);

export default router;