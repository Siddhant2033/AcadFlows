import { Router } from 'express';
import { TenantController } from './controller';
import { TenantSettingsController } from './settings.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateId } from '../../middleware/validate-id';
import { requireTenant } from '../../middleware/tenant-context';
import { schoolRegistrationLimiter } from '../../middleware/rate-limit';
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

/* ─────────────────────────────────────────────────────────────
   SETTINGS — must come BEFORE any /:id catch-all
   ───────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────────
   PUBLIC SCHOOL REGISTRATION — rate-limited
   ───────────────────────────────────────────────────────────── */

router.post(
  '/create-school',
  schoolRegistrationLimiter,
  TenantController.createSchool,
);

/* ─────────────────────────────────────────────────────────────
   PUBLIC — EMAIL VERIFICATION
   ───────────────────────────────────────────────────────────── */

router.post('/verify-email/:token', TenantController.verifySchoolEmail);

/* ─────────────────────────────────────────────────────────────
   PUBLIC — LOOKUPS + VALIDATION
   ───────────────────────────────────────────────────────────── */

router.get('/public/:slug', TenantController.getPublicInfo);
router.get(
  '/public/code/:schoolCode',
  TenantController.getPublicInfoBySchoolCode,
);

router.post('/validate-code', TenantController.validateSchoolCode);
router.get('/validate/:tenantId', TenantController.validateTenant);
router.get('/has-admin/:tenantId', TenantController.hasAdmin);

// Current tenant (public — resolved from header, cookie, or query)
router.get('/current', TenantController.getPublicCurrent);

/* ─────────────────────────────────────────────────────────────
   ADMIN-ONLY ROUTES
   ───────────────────────────────────────────────────────────── */

router.post('/', authenticate, requireRole('admin'), TenantController.create);

router.get(
  '/',
  authenticate,
  requireRole('admin'),
  TenantController.list,
);

router.put(
  '/:id',
  authenticate,
  requireRole('admin'),
  validateId(),
  TenantController.update,
);

// Full current tenant details (requires authentication)
router.get(
  '/current/full',
  authenticate,
  requireTenant(),
  TenantController.getCurrentTenant,
);

/* ─────────────────────────────────────────────────────────────
   PUBLIC SLUG/CODE LOOKUPS
   ───────────────────────────────────────────────────────────── */

router.get('/slug/:slug', TenantController.getBySlug);
router.get('/code/:schoolCode', TenantController.getBySchoolCode);

/* ─────────────────────────────────────────────────────────────
   CATCH-ALL — must be LAST
   ───────────────────────────────────────────────────────────── */

router.get(
  '/:id',
  authenticate,
  validateId(),
  TenantController.getById,
);

export default router;