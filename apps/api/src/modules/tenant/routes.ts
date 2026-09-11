import { Router } from 'express';
import { TenantController } from './controller';
import { TenantSettingsController } from './settings.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateId } from '../../middleware/validate-id';
import { requireTenant } from '../../middleware/tenant-context';
import multer from 'multer';

const router: Router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed') as any, false);
  },
});

// ─────────────────────────────────────────────────────────────
// Settings — must come BEFORE any /:id catch-all
// ─────────────────────────────────────────────────────────────
router.get(
  '/settings',
  authenticate,
  requireRole('admin'),
  TenantSettingsController.getSettings,
);
router.put(
  '/settings',
  authenticate,
  requireRole('admin'),
  TenantSettingsController.updateSettings,
);
router.put(
  '/school-info',
  authenticate,
  requireRole('admin'),
  TenantSettingsController.updateSchoolInfo,
);
router.post(
  '/logo',
  authenticate,
  requireRole('admin'),
  upload.single('logo'),
  TenantSettingsController.uploadLogo,
);
router.delete(
  '/logo',
  authenticate,
  requireRole('admin'),
  TenantSettingsController.removeLogo,
);

// ─────────────────────────────────────────────────────────────
// Public routes
// ─────────────────────────────────────────────────────────────
router.get('/public/:slug', TenantController.getPublicInfo);
router.get('/public/code/:schoolCode', TenantController.getPublicInfoBySchoolCode);
router.post('/validate-code', TenantController.validateSchoolCode);
router.get('/validate/:tenantId', TenantController.validateTenant);
router.get('/has-admin/:tenantId', TenantController.hasAdmin);

// School creation — public
router.post('/create-school', TenantController.createSchool);

// Current tenant (public)
router.get('/current', TenantController.getPublicCurrent);

// Admin-only
router.post('/', authenticate, requireRole('admin'), TenantController.create);
router.put('/:id', authenticate, requireRole('admin'), validateId(), TenantController.update);
router.get('/', authenticate, requireRole('admin'), TenantController.list);

// Full current tenant details (auth required)
router.get('/current/full', authenticate, requireTenant(), TenantController.getCurrentTenant);

// Public lookups
router.get('/slug/:slug', TenantController.getBySlug);
router.get('/code/:schoolCode', TenantController.getBySchoolCode);

// Catch-all — must be LAST
router.get('/:id', authenticate, validateId(), TenantController.getById);

export default router;