// apps/api/src/modules/tenant/routes.ts
import { Router } from 'express';
import { TenantController } from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateId } from '../../middleware/validate-id';

const router: Router = Router();

// Admin only routes
router.post('/', authenticate, requireRole('admin'), TenantController.create);
router.put('/:id', authenticate, requireRole('admin'), validateId(), TenantController.update);
router.get('/', authenticate, requireRole('admin'), TenantController.list);

// Public/tenant routes
router.get('/slug/:slug', TenantController.getBySlug);
router.get('/:id', validateId(), TenantController.getById);

export default router;