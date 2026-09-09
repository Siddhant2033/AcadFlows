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
router.get('/has-admin/:tenantId', TenantController.hasAdmin);

// School creation (public - for admin registration)
router.post('/create-school', TenantController.createSchool);

// Admin only routes
router.post('/', authenticate, requireRole('admin'), TenantController.create);
router.put('/:id', authenticate, requireRole('admin'), validateId(), TenantController.update);
router.get('/', authenticate, requireRole('admin'), TenantController.list);

// Tenant-specific routes
// Require authentication for the current tenant
router.get('/current', authenticate, requireTenant(), TenantController.getCurrentTenant);

// Require authentication for full tenant details
router.get('/current/full', authenticate, requireTenant(), TenantController.getCurrentTenant);

// Public tenant lookup
router.get('/slug/:slug', TenantController.getBySlug);
router.get('/code/:schoolCode', TenantController.getBySchoolCode);
router.get('/:id', authenticate, validateId(), TenantController.getById);

export default router;