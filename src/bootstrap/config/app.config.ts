import { envConfig, isProduction } from '@/bootstrap/config/env.config';
import { IAppConfig } from '@/bootstrap/types/app.types';
import { type Algorithm, type Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms';

/**
 * Allowed origins for Express CORS and Socket.IO.
 * - `CORS_ORIGINS` (optional): comma-separated, for example `http://localhost:3001,http://localhost:5173`
 * - Production default: only `FRONTEND_URL`
 * - Development default: `FRONTEND_URL` + common local origins
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

  const DEFAULT_DEV_CORS_ORIGINS = [] as const;

  return [...new Set([envConfig.FRONTEND_URL, ...DEFAULT_DEV_CORS_ORIGINS])];
}

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

// General configs
export const appConfig: IAppConfig = {
  port: envConfig.PORT,

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
    level: envConfig.LOG_LEVEL
  },

  api: {
    prefix: '/api'
  },

  cors: {
    origin: getCorsAllowedOrigins(),
    credentials: true
  },

  rateLimit: {
    enabled: envConfig.RATE_LIMIT_ENABLED,
    windowMs: envConfig.RATE_LIMIT_WINDOW_MS,
    limit: envConfig.RATE_LIMIT_MAX,
    standardHeaders: 'draft-8' as const, // Return standard rate-limit headers using the IETF draft-8 format.
    legacyHeaders: false, // Disable legacy X-RateLimit-* headers.
    ipv6Subnet: 56 // Group IPv6 clients by subnet to avoid one machine creating too many distinct clients.
  },

  email: {
    apiKey: envConfig.RESEND_API_KEY,
    fromAddress: envConfig.RESEND_FROM_ADDRESS
    // fromAddress: envConfig.SES_FROM_ADDRESS
  },

  systemHealth: {
    enabled: envConfig.SYSTEM_HEALTH_MONITOR_ENABLED,
    cron: envConfig.SYSTEM_HEALTH_CRON,
    timezone: envConfig.SYSTEM_HEALTH_TIMEZONE,
    diskPath: envConfig.SYSTEM_HEALTH_DISK_PATH,
    adminEmails: parseCsv(envConfig.SYSTEM_HEALTH_ADMIN_EMAILS),
    alertCooldownSeconds: envConfig.SYSTEM_HEALTH_ALERT_COOLDOWN_SECONDS,
    thresholds: {
      cpu: {
        warning: envConfig.SYSTEM_HEALTH_CPU_WARN,
        critical: envConfig.SYSTEM_HEALTH_CPU_CRITICAL
      },
      memory: {
        warning: envConfig.SYSTEM_HEALTH_RAM_WARN,
        critical: envConfig.SYSTEM_HEALTH_RAM_CRITICAL
      },
      disk: {
        warning: envConfig.SYSTEM_HEALTH_DISK_WARN,
        critical: envConfig.SYSTEM_HEALTH_DISK_CRITICAL
      },
      processMemoryMb: {
        warning: envConfig.SYSTEM_HEALTH_PROCESS_MEMORY_WARN_MB,
        critical: envConfig.SYSTEM_HEALTH_PROCESS_MEMORY_CRITICAL_MB
      }
    }
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
  },

  cloudinary: {
    cloudName: envConfig.CLOUDINARY_CLOUD_NAME,
    apiKey: envConfig.CLOUDINARY_API_KEY,
    apiSecret: envConfig.CLOUDINARY_API_SECRET
  },

  payment: {
    vnpay: {
      tmnCode: envConfig.VNPAY_TMN_CODE,
      secureSecret: envConfig.VNPAY_SECURE_SECRET,
      vnpayHost: envConfig.VNPAY_HOST
    },
    momo: {
      partnerCode: envConfig.MOMO_PARTNER_CODE,
      accessKey: envConfig.MOMO_ACCESS_KEY,
      secretKey: envConfig.MOMO_SECRET_KEY,
      storeId: envConfig.MOMO_STORE_ID,
      storeName: envConfig.MOMO_STORE_NAME
    },
    paymentPublicBaseUrl: envConfig.PAYMENT_PUBLIC_BASE_URL
  }
};
