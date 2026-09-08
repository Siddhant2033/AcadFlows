import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError } from './error-handler';

export function validateId(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError(`Invalid ${paramName} format. Must be a valid 24-character hex string.`, 400));
    }
    next();
  };
}

// For multiple IDs
export function validateIds(paramNames: string[] = ['id']) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName];
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        return next(new AppError(`Invalid ${paramName} format. Must be a valid 24-character hex string.`, 400));
      }
    }
    next();
  };
}