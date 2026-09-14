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

/* ─────────────────────────────────────────────────────────────
   Cookie options for the refresh token
   ───────────────────────────────────────────────────────────── */

function getRefreshCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'none';
  maxAge: number;
  path: string;
  partitioned?: boolean;
} {
  const isProd = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL || '';
  const backendHost = process.env.RENDER_EXTERNAL_HOSTNAME || '';

  let isCrossSite = isProd;

  if (isProd && frontendUrl && backendHost) {
    try {
      const frontendHost = new URL(frontendUrl).hostname;
      const backendRoot = backendHost.split('.').slice(-2).join('.');
      isCrossSite = !frontendHost.endsWith(backendRoot);
    } catch {
      isCrossSite = true;
    }
  }

  const options: any = {
    httpOnly: true,
    secure: isProd,
    sameSite: isCrossSite ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  if (isCrossSite) {
    options.partitioned = true;
  }

  return options;
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
        status: result.user.status,
        tenantId: result.user.tenantId,
      });

      const cookieOpts = getRefreshCookieOptions();
      res.cookie('refreshToken', result.tokens.refreshToken, cookieOpts);

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

      const cookieOpts = getRefreshCookieOptions();
      res.cookie('refreshToken', result.tokens.refreshToken, cookieOpts);

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

      const cookieOpts = getRefreshCookieOptions();
      res.cookie('refreshToken', tokens.refreshToken, cookieOpts);

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
      const cookieOpts = getRefreshCookieOptions();
      res.clearCookie('refreshToken', {
        httpOnly: cookieOpts.httpOnly,
        secure: cookieOpts.secure,
        sameSite: cookieOpts.sameSite,
        path: cookieOpts.path,
        ...(cookieOpts.partitioned ? { partitioned: true } : {}),
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
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new AppError('User not found', 404);
      }

      const user = await AuthService.getMe(userId);

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
      const validated = forgotPasswordSchema.parse(req.body);
      await AuthService.forgotPassword(validated.email);

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
      const validated = resetPasswordSchema.parse(req.body);
      await AuthService.resetPassword(validated.token, validated.password);

      res.json({
        success: true,
        message:
          'Password reset successfully. You can now login with your new password.',
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