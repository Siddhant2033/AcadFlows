import mongoose from 'mongoose';
import { AppError } from '../middleware/error-handler';

export function validateObjectId(id: string, fieldName: string = 'ID'): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName} format`, 400);
  }
}

export function validateObjectIds(ids: string[], fieldName: string = 'IDs'): void {
  const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    throw new AppError(`Invalid ${fieldName} format: ${invalidIds.join(', ')}`, 400);
  }
}