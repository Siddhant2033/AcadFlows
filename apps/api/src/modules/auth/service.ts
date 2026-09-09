import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { User } from '../../models/User';
import { Tenant } from '../../models/Tenant';
import { AppError } from '../../middleware/error-handler';
import { UserCreateInput, UserLoginInput, AuthTokens } from '@school-platform/shared';
import crypto from 'crypto';

// In production, store reset tokens in Redis or a separate collection
// For MVP, we'll store in memory (will be lost on server restart)
const resetTokens = new Map<string, { userId: string; expiresAt: Date }>();

export class AuthService {
  static async register(input: UserCreateInput): Promise<{ user: any; tokens: AuthTokens }> {
    console.log('🔍 Register service called for:', input.email);
    
    // Validate tenant ID format
    if (!mongoose.Types.ObjectId.isValid(input.tenantId)) {
      console.error('❌ Invalid tenant ID format:', input.tenantId);
      throw new AppError('Invalid tenant ID format. Please use a valid 24-character hex string.', 400);
    }
    
    // Check if tenant exists
    const tenant = await Tenant.findOne({ _id: input.tenantId, status: 'active' });
    if (!tenant) {
      console.error('❌ Tenant not found:', input.tenantId);
      throw new AppError('Tenant not found or inactive', 400);
    }
    
    console.log('✅ Tenant found:', {
      id: tenant._id,
      name: tenant.name,
      schoolCode: tenant.schoolCode,
    });

    // Check if user already exists
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      console.error('❌ User already exists:', input.email);
      throw new AppError('User already exists with this email', 409);
    }

    // Create user
    const user = await User.create({
      tenantId: input.tenantId,
      email: input.email,
      passwordHash: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
    });

    console.log('✅ User created:', {
      id: user._id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    const tokens = this.generateTokens(user.id, user.tenantId, user.email, user.role);

    const { passwordHash: _passwordHash, ...userObj } = user.toObject();

    return { user: userObj, tokens };
  }

  static async login(input: UserLoginInput): Promise<{ user: any; tokens: AuthTokens }> {
    console.log('🔍 Login service called for:', input.email);
    
    const user = await User.findOne({ email: input.email, status: 'active' });
    if (!user) {
      console.error('❌ User not found:', input.email);
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      console.error('❌ Invalid password for:', input.email);
      throw new AppError('Invalid email or password', 401);
    }

    user.lastLoginAt = new Date();
    await user.save();

    console.log('✅ Login successful for:', input.email);

    const tokens = this.generateTokens(user.id, user.tenantId, user.email, user.role);

    const { passwordHash: _passwordHash, ...userObj } = user.toObject();

    return { user: userObj, tokens };
  }

  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    console.log('🔍 Refresh token service called');
    
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
      
      console.log('✅ Refresh token decoded for user:', decoded.email);
      
      const user = await User.findOne({ 
        _id: decoded.userId, 
        status: 'active' 
      });
      
      if (!user) {
        console.error('❌ User not found for refresh token');
        throw new AppError('Invalid refresh token', 401);
      }

      console.log('✅ User found, generating new tokens');
      return this.generateTokens(user.id, user.tenantId, user.email, user.role);
    } catch (error) {
      console.error('❌ Refresh token error:', error);
      throw new AppError('Invalid refresh token', 401);
    }
  }

  private static generateTokens(
    userId: string,
    tenantId: string,
    email: string,
    role: string
  ): AuthTokens {
    const payload = { userId, tenantId, email, role };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiry as SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry as SignOptions['expiresIn'],
    });

    console.log('🔑 Tokens generated for:', email);

    return { accessToken, refreshToken };
  }

  static async forgotPassword(email: string): Promise<void> {
    console.log('🔍 Forgot password service called for:', email);
    
    const user = await User.findOne({ email, status: 'active' });
    if (!user) {
      console.log('⚠️ User not found for forgot password:', email);
      // Still return success to prevent email enumeration
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Store token with expiry (1 hour)
    resetTokens.set(resetToken, {
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    console.log('🔑 Reset token generated for:', email);
    console.log('📧 Reset token (dev):', resetToken);

    // In production, send email with reset link
    // For MVP, we'll log the token and return success
    console.log(`🔗 Reset link: http://localhost:5173/reset-password?token=${resetToken}`);
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    console.log('🔍 Reset password service called');
    
    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      console.error('❌ Invalid or expired token');
      throw new AppError('Invalid or expired reset token', 400);
    }

    if (tokenData.expiresAt < new Date()) {
      console.error('❌ Token expired');
      resetTokens.delete(token);
      throw new AppError('Reset token has expired', 400);
    }

    const user = await User.findById(tokenData.userId);
    if (!user) {
      console.error('❌ User not found for reset token');
      resetTokens.delete(token);
      throw new AppError('User not found', 404);
    }

    // Update password
    user.passwordHash = newPassword;
    await user.save();

    console.log('✅ Password reset successfully for:', user.email);
    
    // Clean up token
    resetTokens.delete(token);
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    console.log('🔍 Change password service called for user:', userId);
    
    const user = await User.findById(userId);
    if (!user) {
      console.error('❌ User not found:', userId);
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      console.error('❌ Invalid current password for user:', userId);
      throw new AppError('Current password is incorrect', 401);
    }

    user.passwordHash = newPassword;
    await user.save();

    console.log('✅ Password changed successfully for user:', userId);
  }
}