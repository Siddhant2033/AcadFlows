import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import { registerSchema, loginSchema, refreshSchema } from './validation';
import { AppError } from '../../middleware/error-handler';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('📝 Registration request body:', req.body);
      
      // Validate the request body
      const validated = registerSchema.parse(req.body);
      console.log('✅ Validated data:', {
        email: validated.email,
        firstName: validated.firstName,
        lastName: validated.lastName,
        role: validated.role,
        tenantId: validated.tenantId,
      });
      
      // Call service to register user
      const result = await AuthService.register(validated);
      
      console.log('✅ User registered successfully:', {
        userId: result.user._id,
        email: result.user.email,
        role: result.user.role,
        tenantId: result.user.tenantId,
      });
      
      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

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
      
      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

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

      // Set new refresh token as HTTP-only cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

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
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      
      console.log('✅ Logout successful for user:', (req as any).user?.email || 'Unknown');
      
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
      // User info is already attached by auth middleware
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
}