import { Router } from 'express';
import { StudentController } from './controller';
import { authenticate } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';

const router: Router = Router();

// Public routes (for guardian verification)
router.post('/verify-rollno', StudentController.verifyRollNo);

// Protected routes
router.use(authenticate);
router.get('/tenant/:tenantId', StudentController.getStudentsByTenant);
router.get('/:studentId', StudentController.getStudentById);
router.post('/', StudentController.createStudent);
router.put('/:studentId', StudentController.updateStudent);
router.post('/:studentId/guardians/verify', StudentController.verifyGuardian);

export default router;