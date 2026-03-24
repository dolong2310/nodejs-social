import { envConfig, isDevelopment, isProduction } from '@/config/envConfig';
import { type Algorithm, type Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms';

/** Origins FE khi chạy local (Next + Vite monorepo). */
const DEFAULT_DEV_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
] as const;

/**
 * Danh sách origin được phép (Express CORS + Socket.IO).
 * - `CORS_ORIGINS` (tùy chọn): comma-separated, ví dụ `http://localhost:3001,http://localhost:5173`
 * - Production mặc định: chỉ `FRONTEND_URL`
 * - Development mặc định: `FRONTEND_URL` + các origin local phổ biến
 */
export function getCorsAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (raw !== undefined && raw.trim() !== '') {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (isProduction) {
    return [envConfig.FRONTEND_URL];
  }
  return [...new Set([envConfig.FRONTEND_URL, ...DEFAULT_DEV_CORS_ORIGINS])];
}

// General configs
export const config = {
  port: parseInt(envConfig.PORT, 10),

  database: {
    uri: envConfig.DATABASE_URI,
    name: envConfig.DATABASE_NAME
  },

  client: {
    url: isProduction ? envConfig.PRODUCTION_URL : envConfig.DEVELOPMENT_URL
  },

  jwt: {
    algorithm: envConfig.JWT_ALGO as Algorithm,
    accessTokenSecret: envConfig.ACCESS_TOKEN_SECRET as Secret,
    refreshTokenSecret: envConfig.REFRESH_TOKEN_SECRET as Secret,
    emailTokenSecret: envConfig.EMAIL_TOKEN_SECRET as Secret,
    forgotPasswordTokenSecret: envConfig.FORGOT_PASSWORD_TOKEN_SECRET as Secret,
    accessTokenExpiresIn: envConfig.ACCESS_TOKEN_EXPIRES_IN as StringValue,
    refreshTokenExpiresIn: envConfig.REFRESH_TOKEN_EXPIRES_IN as StringValue,
    emailTokenExpiresIn: envConfig.EMAIL_TOKEN_EXPIRES_IN as StringValue,
    forgotPasswordTokenExpiresIn: envConfig.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as StringValue
  },

  redis: {
    host: envConfig.REDIS_HOST,
    port: parseInt(envConfig.REDIS_PORT, 10),
    password: envConfig.REDIS_PASSWORD || undefined,
    db: parseInt(envConfig.REDIS_DB, 10)
  },

  logs: {
    /** Pino levels: fatal, error, warn, info, debug, trace, silent */
    level: envConfig.LOG_LEVEL || (isDevelopment ? 'debug' : 'info')
  },

  api: {
    prefix: '/api'
  },

  searchCache: {
    ttlSeconds: Math.max(0, parseInt(envConfig.SEARCH_CACHE_TTL_SECONDS ?? '0', 10))
  },

  rateLimit: {
    enabled: (isProduction && envConfig.RATE_LIMIT_ENABLED !== '0') || envConfig.RATE_LIMIT_ENABLED === '1',
    windowMs: parseInt(envConfig.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
    limit: parseInt(envConfig.RATE_LIMIT_MAX ?? '100', 10),
    standardHeaders: 'draft-8' as const, // Trả về header chuẩn rate limit (bản draft-8 của IETF) cho client.
    legacyHeaders: false, // Tắt header kiểu cũ X-RateLimit-*.
    ipv6Subnet: 56 // Gom IPv6 theo subnet /64-style để tránh một máy tạo quá nhiều “client” khác nhau (theo doc express-rate-limit).
  }
};
