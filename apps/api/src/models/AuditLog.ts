import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  tenantId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'approve' | 'reject';
  resource: string;          // "student", "teacher", "invoice", "leave", etc.
  resourceId?: string;
  description: string;       // Human-readable: "Updated student Aarav Mehta"
  method?: string;           // "POST", "PUT", "DELETE"
  path?: string;             // "/api/v1/students/abc123"
  statusCode?: number;
  ip?: string;
  userAgent?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    userRole: { type: String, required: true },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'login', 'logout', 'export', 'approve', 'reject'],
      required: true,
      index: true,
    },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String, index: true },
    description: { type: String, required: true },
    method: String,
    path: String,
    statusCode: Number,
    ip: String,
    userAgent: String,
    changes: {
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

// Compound indexes for common queries
auditLogSchema.index({ tenantId: 1, createdAt: -1 });
auditLogSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
auditLogSchema.index({ tenantId: 1, resource: 1, createdAt: -1 });

// TTL: auto-delete after 6 months
auditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 6 * 30 * 24 * 60 * 60 },
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);