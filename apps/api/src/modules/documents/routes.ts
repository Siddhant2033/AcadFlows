import { Router } from 'express';
import { DocumentsController } from './controller';
import { authenticate, requireRole, ensureTenantMatch } from '../../middleware/auth';

const router: Router = Router();

router.use(authenticate);
router.use(ensureTenantMatch);

// Return HTML — the frontend opens these in a new tab and prints to PDF.
router.get(
  '/id-cards/students',
  requireRole('admin', 'teacher'),
  DocumentsController.studentIdCards,
);

router.get(
  '/id-cards/teachers',
  requireRole('admin'),
  DocumentsController.teacherIdCards,
);

export default router;