import { Router } from 'express';
import { AuthController } from './controller';
import { authenticate } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rate-limiter';

const router: Router = Router();

// Public routes with rate limiting
router.post('/register', authRateLimiter, AuthController.register);
router.post('/login', authRateLimiter, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/forgot-password', authRateLimiter, AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, AuthController.resetPassword);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);
router.post('/change-password', authenticate, AuthController.changePassword);

export default router;