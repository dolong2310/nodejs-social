import { envConfig, isDevelopment, isProduction } from '@/bootstrap/config/env.config';
import { IAppConfig } from '@/bootstrap/types/app.type';
import { type Algorithm, type Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms';

/**
 * Danh sách origin được phép (Express CORS + Socket.IO).
 * - `CORS_ORIGINS` (tùy chọn): comma-separated, ví dụ `http://localhost:3001,http://localhost:5173`
 * - Production mặc định: chỉ `FRONTEND_URL`
 * - Development mặc định: `FRONTEND_URL` + các origin local phổ biến
 */
function getCorsAllowedOrigins(): string[] {
  const raw = envConfig.CORS_ORIGINS;
  if (raw !== undefined && raw.trim() !== '') {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (isProduction) {
    return [envConfig.FRONTEND_URL];
  }

  const DEFAULT_DEV_CORS_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ] as const;

  return [...new Set([envConfig.FRONTEND_URL, ...DEFAULT_DEV_CORS_ORIGINS])];
}

// General configs
export const appConfig: IAppConfig = {
  port: parseInt(envConfig.PORT, 10),

  client: {
    url: envConfig.APP_URL
  },

  jwt: {
    algorithm: envConfig.JWT_ALGO as Algorithm,
    accessTokenSecret: envConfig.ACCESS_TOKEN_SECRET as Secret,
    refreshTokenSecret: envConfig.REFRESH_TOKEN_SECRET as Secret,
    accessTokenExpiresIn: envConfig.ACCESS_TOKEN_EXPIRES_IN as StringValue,
    refreshTokenExpiresIn: envConfig.REFRESH_TOKEN_EXPIRES_IN as StringValue
  },

  auth: {
    apiKey: envConfig.API_KEY
  },

  logs: {
    /** Pino levels: fatal, error, warn, info, debug, trace, silent */
    level: envConfig.LOG_LEVEL || (isDevelopment ? 'debug' : 'info')
  },

  api: {
    prefix: '/api'
  },

  cors: {
    origin: getCorsAllowedOrigins(),
    credentials: true
  },

  rateLimit: {
    enabled: envConfig.RATE_LIMIT_ENABLED === '1',
    windowMs: parseInt(envConfig.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
    limit: parseInt(envConfig.RATE_LIMIT_MAX ?? '100', 10),
    standardHeaders: 'draft-8' as const, // Trả về header chuẩn rate limit (bản draft-8 của IETF) cho client.
    legacyHeaders: false, // Tắt header kiểu cũ X-RateLimit-*.
    ipv6Subnet: 56 // Gom IPv6 theo subnet /64-style để tránh một máy tạo quá nhiều “client” khác nhau (theo doc express-rate-limit).
  },

  email: {
    fromAddress: envConfig.SES_FROM_ADDRESS
  },

  google: {
    clientId: envConfig.GOOGLE_CLIENT_ID,
    clientSecret: envConfig.GOOGLE_CLIENT_SECRET,
    redirectUri: envConfig.GOOGLE_REDIRECT_URI
  },

  s3: {
    region: envConfig.AWS_REGION,
    accessKeyId: envConfig.AWS_ACCESS_KEY_ID,
    secretAccessKey: envConfig.AWS_SECRET_ACCESS_KEY,
    bucketName: envConfig.AWS_S3_BUCKET_NAME
  }
};
