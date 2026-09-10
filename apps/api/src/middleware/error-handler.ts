import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

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

/**
 * Turn a Zod error into a single human-readable message.
 * Never leaks raw Zod structure to clients.
 */
function formatZodError(error: ZodError): string {
  const issues = error.issues;

  if (issues.length === 1) {
    return issues[0].message;
  }

  const messages = issues.slice(0, 3).map(issue => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });

  const extra = issues.length > 3 ? ` (and ${issues.length - 3} more)` : '';
  return messages.join('; ') + extra;
}

export function errorHandler(
  err: Error | AppError | mongoose.Error | ZodError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error('Error:', err);

  // ── Zod validation errors ──
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: formatZodError(err),
      details: err.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  // ── Mongoose validation errors ──
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: errors.length === 1 ? errors[0] : errors.join('; '),
      details: Object.entries(err.errors).map(([field, e]) => ({
        field,
        message: e.message,
      })),
    });
  }

  // ── Mongoose cast errors (bad ObjectId) ──
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      error: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // ── Duplicate key ──
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
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal server error',
  });
}