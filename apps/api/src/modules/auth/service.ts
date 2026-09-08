import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { User } from '../../models/User';
import { Tenant } from '../../models/Tenant';
import { AppError } from '../../middleware/error-handler';
import { UserCreateInput, UserLoginInput, AuthTokens } from '@school-platform/shared';

export class AuthService {
  static async register(input: UserCreateInput): Promise<{ user: any; tokens: AuthTokens }> {
    // Validate tenant ID format
    if (!mongoose.Types.ObjectId.isValid(input.tenantId)) {
      throw new AppError('Invalid tenant ID format. Please use a valid 24-character hex string.', 400);
    }
    
    // Check if tenant exists
    const tenant = await Tenant.findOne({ _id: input.tenantId, status: 'active' });
    if (!tenant) {
      throw new AppError('Tenant not found or inactive', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw new AppError('User already exists with this email', 409);
    }

    // Create user
    const user = await User.create({
      tenantId: input.tenantId,
      email: input.email,
      passwordHash: input.password, // Will be hashed by pre-save hook
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.tenantId, user.email, user.role);

    // Return user without password
    const { passwordHash: _passwordHash, ...userObj } = user.toObject();

    return { user: userObj, tokens };
  }

  static async login(input: UserLoginInput): Promise<{ user: any; tokens: AuthTokens }> {
    // Find user with email
    const user = await User.findOne({ email: input.email, status: 'active' });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(input.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.tenantId, user.email, user.role);

    // Return user without password
    const { passwordHash: _passwordHash, ...userObj } = user.toObject();

    return { user: userObj, tokens };
  }

  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
      
      // Verify user still exists and is active
      const user = await User.findOne({ 
        _id: decoded.userId, 
        status: 'active' 
      });
      
      if (!user) {
        throw new AppError('Invalid refresh token', 401);
      }

      return this.generateTokens(user.id, user.tenantId, user.email, user.role);
    } catch (error) {
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
      expiresIn: config.jwt.expiry as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry as jwt.SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  }
}