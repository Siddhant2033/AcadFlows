import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

/* ─────────────────────────────────────────────────────────────
   Fail-fast checks — only in production
   ───────────────────────────────────────────────────────────── */

if (isProduction) {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'FRONTEND_URL',
  ] as const;

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables in production: ${missing.join(', ')}`,
    );
    process.exit(1);
  }

  if ((process.env.JWT_SECRET || '').length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters in production.');
    process.exit(1);
  }
  if ((process.env.JWT_REFRESH_SECRET || '').length < 32) {
    console.error(
      '❌ JWT_REFRESH_SECRET must be at least 32 characters in production.',
    );
    process.exit(1);
  }
}

export const config = {
  nodeEnv,
  isProduction,
  port: parseInt(process.env.PORT || '5000', 10),

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/acadflows',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    expiry: process.env.JWT_EXPIRY || '60m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },

  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  tenant: {
    defaultId: process.env.DEFAULT_TENANT_ID || 'default',
    defaultSlug: process.env.DEFAULT_TENANT_SLUG || 'default',
  },

  // Platform admin — the founder (you)
  platformAdmin: {
    email: process.env.PLATFORM_ADMIN_EMAIL || '',
  },

  storage: {
    r2Endpoint: process.env.R2_ENDPOINT || '',
    r2AccessKey: process.env.R2_ACCESS_KEY || '',
    r2SecretKey: process.env.R2_SECRET_KEY || '',
    r2Bucket: process.env.R2_BUCKET || '',
  },

  domain: {
    baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  },

  india: {
    country: 'IN',
    currency: 'INR',
    currencySymbol: '₹',
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
    phoneCode: '+91',
    dateFormat: 'DD/MM/YYYY',
    academic: {
      startMonth: 4,
      endMonth: 3,
      board: 'CBSE',
    },
  },
} as const;