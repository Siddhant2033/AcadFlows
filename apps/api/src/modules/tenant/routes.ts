import { Router } from 'express';
import { TenantController } from './controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// Admin only routes
router.post('/', authenticate, requireRole('admin'), TenantController.create);
router.put('/:id', authenticate, requireRole('admin'), TenantController.update);
router.get('/', authenticate, requireRole('admin'), TenantController.list);

// Public/tenant routes
router.get('/slug/:slug', TenantController.getBySlug);
router.get('/:id', authenticate, TenantController.getById);

export default router;