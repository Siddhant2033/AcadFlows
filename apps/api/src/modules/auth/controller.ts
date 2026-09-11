import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './validation';
import { AppError } from '../../middleware/error-handler';

/**
 * Cookie options for the refresh token.
 *
 * - In production: `sameSite: 'none'` + `secure: true`. Required when the
 *   frontend (acadflows.vercel.app) and backend (acadflows.onrender.com)
 *   are on different origins and the cookie must be sent cross-site.
 * - In development: `sameSite: 'lax'` + `secure: false`. Works on
 *   http://localhost and does not require HTTPS.
 */
function getRefreshCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'none';
  maxAge: number;
  path: string;
} {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
}

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('📝 Registration request body:', req.body);

      const validated = registerSchema.parse(req.body);
      console.log('✅ Validated data:', {
        email: validated.email,
        firstName: validated.firstName,
        lastName: validated.lastName,
        role: validated.role,
        tenantId: validated.tenantId,
      });

      const result = await AuthService.register(validated);

      console.log('✅ User registered successfully:', {
        userId: result.user._id,
        email: result.user.email,
        role: result.user.role,
        tenantId: result.user.tenantId,
      });

      res.cookie('refreshToken', result.tokens.refreshToken, getRefreshCookieOptions());

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
        },
        message: 'Registration successful!',
      });
    } catch (error) {
      console.error('❌ Registration error:', error);
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('📝 Login request for:', req.body.email);

      const validated = loginSchema.parse(req.body);
      const result = await AuthService.login(validated);

      console.log('✅ Login successful for:', result.user.email);

      res.cookie('refreshToken', result.tokens.refreshToken, getRefreshCookieOptions());

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
        },
        message: 'Login successful!',
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        throw new AppError('Refresh token required', 401);
      }

      const validated = refreshSchema.parse({ refreshToken });
      const tokens = await AuthService.refreshToken(validated.refreshToken);

      console.log('✅ Token refreshed successfully');

      res.cookie('refreshToken', tokens.refreshToken, getRefreshCookieOptions());

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
        },
        message: 'Token refreshed successfully!',
      });
    } catch (error) {
      console.error('❌ Refresh token error:', error);
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const options = getRefreshCookieOptions();
      res.clearCookie('refreshToken', {
        httpOnly: options.httpOnly,
        secure: options.secure,
        sameSite: options.sameSite,
        path: options.path,
      });

      console.log(
        '✅ Logout successful for user:',
        (req as any).user?.email || 'Unknown',
      );

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      if (!user) {
        throw new AppError('User not found', 404);
      }

      console.log('👤 User info requested for:', user.email);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      console.error('❌ User info error:', error);
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('📝 Forgot password request for:', req.body.email);

      const validated = forgotPasswordSchema.parse(req.body);
      await AuthService.forgotPassword(validated.email);

      console.log('✅ Password reset email sent to:', validated.email);

      res.json({
        success: true,
        message: 'Password reset instructions sent to your email.',
      });
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('📝 Reset password request received');

      const validated = resetPasswordSchema.parse(req.body);
      await AuthService.resetPassword(validated.token, validated.password);

      console.log('✅ Password reset successfully');

      res.json({
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
      });
    } catch (error) {
      console.error('❌ Reset password error:', error);
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const validated = changePasswordSchema.parse(req.body);

      await AuthService.changePassword(
        userId,
        validated.currentPassword,
        validated.newPassword,
      );

      console.log('✅ Password changed for user:', userId);

      res.json({
        success: true,
        message: 'Password changed successfully.',
      });
    } catch (error) {
      console.error('❌ Change password error:', error);
      next(error);
    }
  }
}