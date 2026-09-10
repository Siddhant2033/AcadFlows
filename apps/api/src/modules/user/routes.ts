import { Router } from 'express';
import { UserController } from './controller';
import multer from 'multer';
import { authenticate, requireRole, ensureTenantMatch } from '../../middleware/auth';

const router: Router = Router();

router.use(ensureTenantMatch);

// Configure multer for memory storage (for MVP)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed') as any, false);
    }
  },
});

// Protected routes
router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.post('/change-password', UserController.changePassword);
router.post(
  '/profile-picture',
  upload.single('profilePicture'),
  UserController.uploadProfilePicture
);
router.delete('/profile-picture', UserController.removeProfilePicture);

export default router;