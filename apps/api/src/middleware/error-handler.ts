import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

interface MongoDuplicateKeyError extends Error {
  code?: number;
  keyPattern?: Record<string, unknown>;
  keyValue?: Record<string, unknown>;
}

export function errorHandler(
  err: Error | AppError | mongoose.Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error('Error:', err);

  // ── Mongoose validation errors ──
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors,
    });
  }

  // ── Mongoose cast errors (e.g. bad ObjectId) ──
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      error: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // ── Duplicate key error (MongoServerError with code 11000) ──
  // FIXED B10: The old check used `instanceof mongoose.Error`, which never
  // matched because MongoServerError is not a subclass of mongoose.Error.
  const mongoErr = err as MongoDuplicateKeyError;
  if (mongoErr.code === 11000) {
    const field = Object.keys(mongoErr.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: `A record with this ${field} already exists`,
      field,
    });
  }

  // ── Custom AppError ──
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // ── Unknown errors ──
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
}