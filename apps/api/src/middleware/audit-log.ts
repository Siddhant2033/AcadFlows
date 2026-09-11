import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog';
import type { AuthRequest } from './auth';

/**
 * Map of method + path patterns to a friendly description and resource name.
 * Order matters: first match wins.
 */
interface RouteRule {
  method: string;
  pattern: RegExp;
  resource: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'approve' | 'reject';
  describe: (params: Record<string, string>) => string;
}

const ROUTE_RULES: RouteRule[] = [
  // Auth
  { method: 'POST', pattern: /^\/api\/v1\/auth\/login$/, resource: 'auth', action: 'login', describe: () => 'Signed in' },
  { method: 'POST', pattern: /^\/api\/v1\/auth\/logout$/, resource: 'auth', action: 'logout', describe: () => 'Signed out' },
  { method: 'POST', pattern: /^\/api\/v1\/auth\/register$/, resource: 'user', action: 'create', describe: () => 'Registered new user' },

  // Students
  { method: 'POST', pattern: /^\/api\/v1\/students$/, resource: 'student', action: 'create', describe: () => 'Created a student' },
  { method: 'PUT', pattern: /^\/api\/v1\/students\/([^/]+)$/, resource: 'student', action: 'update', describe: (p) => `Updated student ${p.id}` },
  { method: 'DELETE', pattern: /^\/api\/v1\/students\/([^/]+)$/, resource: 'student', action: 'delete', describe: (p) => `Deleted student ${p.id}` },
  { method: 'GET', pattern: /^\/api\/v1\/students\/export$/, resource: 'student', action: 'export', describe: () => 'Exported students CSV' },
  { method: 'POST', pattern: /^\/api\/v1\/students\/bulk-import$/, resource: 'student', action: 'create', describe: () => 'Bulk imported students' },

  // Teachers
  { method: 'POST', pattern: /^\/api\/v1\/teachers$/, resource: 'teacher', action: 'create', describe: () => 'Created a teacher' },
  { method: 'PUT', pattern: /^\/api\/v1\/teachers\/([^/]+)$/, resource: 'teacher', action: 'update', describe: (p) => `Updated teacher ${p.id}` },
  { method: 'DELETE', pattern: /^\/api\/v1\/teachers\/([^/]+)$/, resource: 'teacher', action: 'delete', describe: (p) => `Deleted teacher ${p.id}` },
  { method: 'GET', pattern: /^\/api\/v1\/teachers\/export$/, resource: 'teacher', action: 'export', describe: () => 'Exported teachers CSV' },

  // Fees
  { method: 'POST', pattern: /^\/api\/v1\/fees\/structures$/, resource: 'fee_structure', action: 'create', describe: () => 'Created a fee structure' },
  { method: 'PUT', pattern: /^\/api\/v1\/fees\/structures\/([^/]+)$/, resource: 'fee_structure', action: 'update', describe: (p) => `Updated fee structure ${p.id}` },
  { method: 'DELETE', pattern: /^\/api\/v1\/fees\/structures\/([^/]+)$/, resource: 'fee_structure', action: 'delete', describe: (p) => `Deleted fee structure ${p.id}` },
  { method: 'POST', pattern: /^\/api\/v1\/fees\/invoices$/, resource: 'invoice', action: 'create', describe: () => 'Generated an invoice' },
  { method: 'PUT', pattern: /^\/api\/v1\/fees\/invoices\/([^/]+)\/status$/, resource: 'invoice', action: 'update', describe: (p) => `Updated invoice status ${p.id}` },
  { method: 'POST', pattern: /^\/api\/v1\/fees\/payments$/, resource: 'payment', action: 'create', describe: () => 'Recorded a payment' },
  { method: 'POST', pattern: /^\/api\/v1\/fees\/discounts$/, resource: 'discount', action: 'create', describe: () => 'Created a discount code' },
  { method: 'PUT', pattern: /^\/api\/v1\/fees\/discounts\/([^/]+)$/, resource: 'discount', action: 'update', describe: (p) => `Updated discount ${p.id}` },
  { method: 'DELETE', pattern: /^\/api\/v1\/fees\/discounts\/([^/]+)$/, resource: 'discount', action: 'delete', describe: (p) => `Deleted discount ${p.id}` },
  { method: 'GET', pattern: /^\/api\/v1\/fees\/invoices\/export$/, resource: 'invoice', action: 'export', describe: () => 'Exported invoices CSV' },
  { method: 'GET', pattern: /^\/api\/v1\/fees\/payments\/export$/, resource: 'payment', action: 'export', describe: () => 'Exported payments CSV' },

  // Leaves
  { method: 'PUT', pattern: /^\/api\/v1\/teachers\/leaves\/([^/]+)\/status$/, resource: 'leave', action: 'approve', describe: (p) => `Updated leave ${p.id}` },

  // Settings
  { method: 'PUT', pattern: /^\/api\/v1\/tenants\/settings$/, resource: 'settings', action: 'update', describe: () => 'Updated school settings' },
  { method: 'PUT', pattern: /^\/api\/v1\/tenants\/school-info$/, resource: 'settings', action: 'update', describe: () => 'Updated school information' },
  { method: 'POST', pattern: /^\/api\/v1\/tenants\/logo$/, resource: 'settings', action: 'update', describe: () => 'Uploaded school logo' },
  { method: 'DELETE', pattern: /^\/api\/v1\/tenants\/logo$/, resource: 'settings', action: 'delete', describe: () => 'Removed school logo' },

  // Academic
  { method: 'POST', pattern: /^\/api\/v1\/academic\/academic-years$/, resource: 'academic_year', action: 'create', describe: () => 'Created academic year' },
  { method: 'PUT', pattern: /^\/api\/v1\/academic\/academic-years\/([^/]+)$/, resource: 'academic_year', action: 'update', describe: (p) => `Updated academic year ${p.id}` },
  { method: 'DELETE', pattern: /^\/api\/v1\/academic\/academic-years\/([^/]+)$/, resource: 'academic_year', action: 'delete', describe: (p) => `Deleted academic year ${p.id}` },
  { method: 'POST', pattern: /^\/api\/v1\/academic\/grades$/, resource: 'grade', action: 'create', describe: () => 'Created grade' },
  { method: 'POST', pattern: /^\/api\/v1\/academic\/sections$/, resource: 'section', action: 'create', describe: () => 'Created section' },
  { method: 'POST', pattern: /^\/api\/v1\/academic\/subjects$/, resource: 'subject', action: 'create', describe: () => 'Created subject' },
];

const AUDIT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Records an audit log entry after a successful response.
 * Fire-and-forget: never blocks the response, never throws.
 */
export function auditLog(req: Request, res: Response, next: NextFunction) {
  // Skip non-mutating requests except GET exports
  const isMutation = AUDIT_METHODS.has(req.method);
  const isExport = req.method === 'GET' && /\/export$/.test(req.path);
  if (!isMutation && !isExport) {
    return next();
  }

  // Skip noisy paths
  if (req.path.startsWith('/api/v1/auth/refresh')) return next();
  if (req.path.startsWith('/api/v1/communication')) return next();

  const startTime = Date.now();

  res.on('finish', () => {
    try {
      // Only log successful or auth-related responses
      if (res.statusCode >= 500) return;

      const rule = ROUTE_RULES.find(
        r => r.method === req.method && r.pattern.test(req.path),
      );

      const authReq = req as AuthRequest;
      if (!authReq.user) return;

      const params: Record<string, string> = {};
      if (rule) {
        const match = req.path.match(rule.pattern);
        if (match) {
          const keys = ['id', 'teacherId', 'studentId', 'leaveId', 'invoiceId'];
          match.slice(1).forEach((val, i) => {
            params[keys[i] || `param${i}`] = val;
          });
        }
      }

      const action = rule?.action || (req.method === 'POST' ? 'create' : req.method === 'DELETE' ? 'delete' : 'update');
      const resource = rule?.resource || req.path.split('/').filter(Boolean)[2] || 'unknown';
      const description = rule ? rule.describe(params) : `${req.method} ${req.path}`;

      // Fire-and-forget
      AuditLog.create({
        tenantId: authReq.user.tenantId,
        userId: authReq.user.id,
        userEmail: authReq.user.email,
        userRole: authReq.user.role,
        action,
        resource,
        resourceId: params.id || params.studentId || params.teacherId || params.leaveId,
        description,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ip: req.ip || req.socket.remoteAddress || '',
        userAgent: req.get('user-agent') || '',
      }).catch(err => {
        console.error('Audit log write failed:', err);
      });
    } catch (err) {
      console.error('Audit log middleware error:', err);
    }
  });

  next();
}