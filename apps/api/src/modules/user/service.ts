import mongoose from 'mongoose';
import { User } from '../../models/User';
import { AppError } from '../../middleware/error-handler';

export class UserService {
  /**
   * Returns true if the tenant has any active admin.
   * Used during the register flow to prevent a fresh school from being
   * claimed by a non-admin role.
   */
  static async adminExistsForTenant(tenantId: string): Promise<boolean> {
    const admin = await User.findOne({
      tenantId,
      role: 'admin',
      status: 'active',
    });
    return !!admin;
  }

  static async getProfile(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  static async updateProfile(userId: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    // Remove undefined / null fields
    Object.keys(data).forEach(key => {
      if (data[key] === undefined || data[key] === null) {
        delete data[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true },
    ).select('-passwordHash');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    user.passwordHash = newPassword;
    await user.save();
  }

  static async uploadProfilePicture(userId: string, file: any) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    // For MVP, store as base64 data URL. Replace with R2/S3 upload later.
    const imageUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { profilePicture: imageUrl } },
      { new: true },
    ).select('-passwordHash');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return imageUrl;
  }

  static async removeProfilePicture(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { profilePicture: '' } },
      { new: true },
    ).select('-passwordHash');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}