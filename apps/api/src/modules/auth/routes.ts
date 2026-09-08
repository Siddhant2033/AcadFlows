import { Router } from 'express';
import { AuthController } from './controller';
import { authenticate } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rate-limiter';

const router = Router();

// Public routes with rate limiting
router.post('/register', authRateLimiter, AuthController.register);
router.post('/login', authRateLimiter, AuthController.login);
router.post('/refresh', AuthController.refresh);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;