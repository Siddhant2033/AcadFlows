import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { tenantContext } from './middleware/tenant-context';
import { connectDB } from './config/database';

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

const app: Express = express();

// Connect to MongoDB
connectDB();

// ─────────────────────────────────────────────────────────────
// Trust proxy — required on Render, Vercel, and any reverse proxy.
// Without this, req.ip is wrong and `secure` cookies may fail.
// ─────────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ─────────────────────────────────────────────────────────────
// Security headers
// ─────────────────────────────────────────────────────────────
app.use(
  helmet({
    // The API serves JSON only; CSP is best enforced on the frontend
    // (Vercel). We relax crossOriginResourcePolicy so file uploads /
    // images can be loaded cross-origin from the frontend.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }),
);

// ─────────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  }),
);

// ─────────────────────────────────────────────────────────────
// Body parsers
// ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ─────────────────────────────────────────────────────────────
// Tenant context (cached) — runs for every request
// ─────────────────────────────────────────────────────────────
app.use(tenantContext);

// ─────────────────────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────
// Public + mixed modules
//
// Modules with public routes (e.g. /students/verify-rollno,
// /users/admin-exists/:tenantId) handle their own auth internally
// so those routes remain reachable without a login.
// ─────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/users', userRoutes);

// ─────────────────────────────────────────────────────────────
// Fully-protected modules — each router calls authenticate() itself
// ─────────────────────────────────────────────────────────────
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/academic', academicRoutes);
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/communication', communicationRoutes);
app.use('/api/v1/timetable', timetableRoutes);

// ─────────────────────────────────────────────────────────────
// Error handling (must be last)
// ─────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;