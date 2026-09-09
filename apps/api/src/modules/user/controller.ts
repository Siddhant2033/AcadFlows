import { Request, Response, NextFunction } from 'express';
import { UserService } from './service';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/auth';

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().optional(),
  bio: z.string().max(500).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const user = await UserService.getProfile(authReq.user.id);
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = updateProfileSchema.parse(req.body);
      const user = await UserService.updateProfile(authReq.user.id, validated);
      
      res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const validated = changePasswordSchema.parse(req.body);
      
      await UserService.changePassword(
        authReq.user.id,
        validated.currentPassword,
        validated.newPassword
      );
      
      res.json({
        success: true,
        message: 'Password changed successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadProfilePicture(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      
      const file = (req as Request & { file?: Express.Multer.File }).file;

      if (!file) {
        throw new Error('No file uploaded');
      }
      
      // In production, upload to Cloudflare R2 or similar
      // For MVP, we'll store base64 or a URL
      const imageUrl = await UserService.uploadProfilePicture(
        authReq.user.id,
        file
      );
      
      res.json({
        success: true,
        data: { profilePicture: imageUrl },
        message: 'Profile picture updated successfully!',
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeProfilePicture(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      await UserService.removeProfilePicture(authReq.user.id);
      
      res.json({
        success: true,
        message: 'Profile picture removed successfully!',
      });
    } catch (error) {
      next(error);
    }
  }
}