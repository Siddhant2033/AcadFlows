import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/school-platform',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    expiry: process.env.JWT_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  
  tenant: {
    defaultId: process.env.DEFAULT_TENANT_ID || 'default',
  },
  
  storage: {
    r2Endpoint: process.env.R2_ENDPOINT || '',
    r2AccessKey: process.env.R2_ACCESS_KEY || '',
    r2SecretKey: process.env.R2_SECRET_KEY || '',
    r2Bucket: process.env.R2_BUCKET || '',
  },
} as const;