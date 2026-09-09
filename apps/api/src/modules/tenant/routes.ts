import { Router } from 'express';
import { TenantController } from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateId } from '../../middleware/validate-id';
import { requireTenant } from '../../middleware/tenant-context';

const router: Router = Router();

// Public routes (no authentication required)
router.get('/public/:slug', TenantController.getPublicInfo);
router.get('/public/code/:schoolCode', TenantController.getPublicInfoBySchoolCode);
router.post('/validate-code', TenantController.validateSchoolCode);
router.get('/validate/:tenantId', TenantController.validateTenant);

// School creation (public - for admin registration)
router.post('/create-school', TenantController.createSchool);

// Admin only routes
router.post('/', authenticate, requireRole('admin'), TenantController.create);
router.put('/:id', authenticate, requireRole('admin'), validateId(), TenantController.update);
router.get('/', authenticate, requireRole('admin'), TenantController.list);

// Tenant-specific routes (require tenant context)
router.get('/current', authenticate, requireTenant(), TenantController.getCurrentTenant);

// Public tenant lookup
router.get('/slug/:slug', TenantController.getBySlug);
router.get('/code/:schoolCode', TenantController.getBySchoolCode);
router.get('/:id', authenticate, validateId(), TenantController.getById);

export default router;