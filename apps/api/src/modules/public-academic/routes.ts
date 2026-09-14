import { Router } from 'express';
import { GradeController, SectionController } from '../academic/controller';

const router: Router = Router();

/**
 * Public academic lookups — used by the register flow (student form,
 * guardian form) to populate grade + section dropdowns before a user
 * has a session.
 *
 * These routes are unauthenticated by design. Tenant is resolved from
 * the `tenantContext` middleware via `?tenantId=`, header, or cookie.
 *
 * Read-only. No write endpoints are exposed here.
 */

router.get('/grades', GradeController.getAll);
router.get('/sections', SectionController.getAll);

export default router;