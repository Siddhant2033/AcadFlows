import { Router } from 'express';
import { TenantController } from './controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateId } from '../../middleware/validate-id';
import { requireTenant } from '../../middleware/tenant-context';

const router: Router = Router();

// Public routes - skip authentication
router.get('/public/:slug', TenantController.getPublicInfo);
router.get('/public/code/:schoolCode', TenantController.getPublicInfoBySchoolCode);
router.post('/validate-code', TenantController.validateSchoolCode);
router.get('/validate/:tenantId', TenantController.validateTenant);
router.get('/has-admin/:tenantId', TenantController.hasAdmin);

// School creation - public
router.post('/create-school', TenantController.createSchool);

// Current tenant - public (no auth required)
// IMPORTANT: This must come BEFORE /:id route to avoid conflict
router.get('/current', TenantController.getPublicCurrent);

// Admin only routes
router.post('/', authenticate, requireRole('admin'), TenantController.create);
router.put('/:id', authenticate, requireRole('admin'), validateId(), TenantController.update);
router.get('/', authenticate, requireRole('admin'), TenantController.list);

// Tenant-specific routes (require authentication for full details)
router.get('/current/full', authenticate, requireTenant(), TenantController.getCurrentTenant);

// Public tenant lookup - these should come AFTER /current
router.get('/slug/:slug', TenantController.getBySlug);
router.get('/code/:schoolCode', TenantController.getBySchoolCode);

// This must be LAST to avoid conflicts with /current and /slug/:slug
router.get('/:id', authenticate, validateId(), TenantController.getById);

export default router;