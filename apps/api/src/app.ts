import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { tenantContext } from './middleware/tenant-context';
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

const app: Express = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Tenant context middleware
app.use(tenantContext);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tenants', tenantRoutes);


// Authenticated routes — apply tenant match guard


app.use('/api/v1/dashboard', authenticate, ensureTenantMatch, dashboardRoutes);
app.use('/api/v1/students', authenticate, ensureTenantMatch, studentRoutes);
app.use('/api/v1/users', authenticate, ensureTenantMatch, userRoutes);
app.use('/api/v1/academic', authenticate, ensureTenantMatch, academicRoutes);
app.use('/api/v1/teachers', authenticate, ensureTenantMatch, teacherRoutes);
app.use('/api/v1/fees', authenticate, ensureTenantMatch, feeRoutes);
app.use('/api/v1/assignments', authenticate, ensureTenantMatch, assignmentRoutes);
app.use('/api/v1/communication', authenticate, ensureTenantMatch, communicationRoutes);
app.use('/api/v1/timetable', authenticate, ensureTenantMatch, timetableRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;