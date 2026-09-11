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
// Global middleware
// ─────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  }),
);

// Explicit body size limits — prevents accidental DoS via huge payloads.
// File uploads use multer, which handles its own limits per-route.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Tenant context runs for every request
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
// IMPORTANT: Do NOT mount `authenticate` or `ensureTenantMatch` at
// the app level for these modules. They each declare their own public
// routes (e.g. /students/verify-rollno, /users/admin-exists/:tenantId)
// BEFORE their router.use(authenticate) line. Mounting auth here would
// block those public routes.
// ─────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenants', tenantRoutes);

// Students and Users have public routes — modules guard themselves.
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/users', userRoutes);

// ─────────────────────────────────────────────────────────────
// Fully-protected modules
//
// These modules have no public routes. Each also calls
// router.use(authenticate) internally — so we do NOT add auth at
// the app level to avoid running it twice.
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