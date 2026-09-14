import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { tenantContext } from './middleware/tenant-context';
import { auditLog } from './middleware/audit-log';
import { connectDB } from './config/database';
import { authenticate, ensureTenantMatch } from './middleware/auth';

// Import routes
import authRoutes from './modules/auth/routes';
import tenantRoutes from './modules/tenant/routes';
import dashboardRoutes from './modules/dashboard/routes';
import studentRoutes from './modules/students/routes';
import userRoutes from './modules/user/routes';
import academicRoutes from './modules/academic/routes';
import teacherRoutes from './modules/teachers/routes';
import feeRoutes from './modules/fees/routes';
import assignmentRoutes from './modules/assignments/routes';
import communicationRoutes from './modules/communication/routes';
import timetableRoutes from './modules/timetable/routes';
import documentsRoutes from './modules/documents/routes';
import platformRoutes from './modules/platform/routes';
import approvalRoutes from './modules/approvals/routes';

const app: Express = express();

// Connect to MongoDB
connectDB();

/* ─────────────────────────────────────────────────────────────
   Trust proxy — required on Render, Vercel, and any reverse proxy
   ───────────────────────────────────────────────────────────── */
app.set('trust proxy', 1);

/* ─────────────────────────────────────────────────────────────
   Security headers
   ───────────────────────────────────────────────────────────── */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }),
);

/* ─────────────────────────────────────────────────────────────
   CORS
   ───────────────────────────────────────────────────────────── */
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  }),
);

/* ─────────────────────────────────────────────────────────────
   Body parsers
   ───────────────────────────────────────────────────────────── */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

/* ─────────────────────────────────────────────────────────────
   Tenant context (cached) — runs for every request
   ───────────────────────────────────────────────────────────── */
app.use(tenantContext);

/* ─────────────────────────────────────────────────────────────
   Audit log — records mutating requests
   ───────────────────────────────────────────────────────────── */
app.use(auditLog);

/* ─────────────────────────────────────────────────────────────
   Health check
   ───────────────────────────────────────────────────────────── */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ─────────────────────────────────────────────────────────────
   Public modules (no auth required)
   ───────────────────────────────────────────────────────────── */
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenants', tenantRoutes);

// Students & Users have public routes — modules handle their own auth
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/platform', platformRoutes);

/* ─────────────────────────────────────────────────────────────
   Fully-protected modules
   
   IMPORTANT: `authenticate` MUST come before `ensureTenantMatch`.
   The modules' own routes.ts files should NOT apply these — they
   are applied here to guarantee the correct order.
   ───────────────────────────────────────────────────────────── */
app.use('/api/v1/dashboard', authenticate, ensureTenantMatch, dashboardRoutes);
app.use('/api/v1/academic', authenticate, ensureTenantMatch, academicRoutes);
app.use('/api/v1/teachers', authenticate, ensureTenantMatch, teacherRoutes);
app.use('/api/v1/fees', authenticate, ensureTenantMatch, feeRoutes);
app.use('/api/v1/assignments', authenticate, ensureTenantMatch, assignmentRoutes);
app.use('/api/v1/communication', authenticate, ensureTenantMatch, communicationRoutes);
app.use('/api/v1/timetable', authenticate, ensureTenantMatch, timetableRoutes);
app.use('/api/v1/documents', authenticate, ensureTenantMatch, documentsRoutes);

// School-admin approval queues (teachers / students / guardians)
app.use('/api/v1/approvals', authenticate, ensureTenantMatch, approvalRoutes);

/* ─────────────────────────────────────────────────────────────
   Error handling (must be last)
   ───────────────────────────────────────────────────────────── */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;