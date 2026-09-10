import { Router } from 'express';
import { UserController } from './controller';
import { authenticate } from '../../middleware/auth';
import multer from 'multer';

const router: Router = Router();

// ─────────────────────────────────────────────────────────────
// Public routes
// ─────────────────────────────────────────────────────────────

// Used during registration to check if a school needs an admin.
// Must be mounted BEFORE router.use(authenticate).
router.get('/admin-exists/:tenantId', UserController.checkAdminExists);

// ─────────────────────────────────────────────────────────────
// Protected routes
// ─────────────────────────────────────────────────────────────

// Configure multer for memory storage (for MVP)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed') as any, false);
    }
  },
});

router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.post('/change-password', UserController.changePassword);
router.post(
  '/profile-picture',
  upload.single('profilePicture'),
  UserController.uploadProfilePicture,
);
router.delete('/profile-picture', UserController.removeProfilePicture);

export default router;