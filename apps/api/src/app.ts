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
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/students', studentRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;