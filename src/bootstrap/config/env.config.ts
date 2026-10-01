import {
  check,
  flatten,
  integer,
  literal,
  maxValue,
  minLength,
  minValue,
  object,
  optional,
  picklist,
  pipe,
  safeParse,
  string,
  toNumber,
  transform,
  trim,
  union,
  url
} from 'valibot';

const requiredString = pipe(string(), trim(), minLength(1, 'Value is required'));
const urlString = pipe(requiredString, url('Must be a valid URL'));
const optionalUrlString = optional(union([literal(''), urlString]), '');

const positiveInteger = pipe(
  requiredString,
  toNumber('Must be a number'),
  integer('Must be an integer'),
  minValue(1, 'Must be greater than 0')
);

const nonNegativeInteger = pipe(
  requiredString,
  toNumber('Must be a number'),
  integer('Must be an integer'),
  minValue(0, 'Must be 0 or greater')
);

const percentage = pipe(nonNegativeInteger, maxValue(100, 'Must not exceed 100'));

const booleanString = pipe(
  picklist(['true', 'false', '1', '0'], 'Must be true, false, 1, or 0'),
  transform((value) => value === 'true' || value === '1')
);

const httpsOriginString = pipe(
  urlString,
  check((value) => new URL(value).protocol === 'https:', 'Must use HTTPS'),
  check((value) => {
    const parsed = new URL(value);

    return (
      parsed.username === '' &&
      parsed.password === '' &&
      parsed.pathname === '/' &&
      parsed.search === '' &&
      parsed.hash === ''
    );
  }, 'Must be an HTTPS origin without a path, query, or fragment'),
  transform((value) => new URL(value).origin)
);

const envSchema = object({
  // App
  NODE_ENV: picklist(['development', 'staging', 'production']),
  PORT: optional(pipe(positiveInteger, maxValue(65_535, 'Must not exceed 65535')), '3000'),
  LOG_LEVEL: optional(picklist(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']), 'info'),
  FRONTEND_URL: urlString,
  APP_URL: urlString,

  // CORS
  CORS_ORIGINS: optional(string(), ''),

  // Database
  DATABASE_ADAPTER: picklist(['mongo', 'postgres']),
  MONGO_URI: urlString,
  MONGO_SECONDARY_URI: optionalUrlString,
  MONGO_DB_NAME: requiredString,
  POSTGRES_URI: urlString,
  POSTGRES_REPLICA_URIS: optional(string(), ''),
  POSTGRES_SSL: optional(booleanString, 'false'),

  // Redis
  REDIS_HOST: requiredString,
  REDIS_PORT: optional(pipe(positiveInteger, maxValue(65_535, 'Must not exceed 65535')), '6379'),
  REDIS_PASSWORD: optional(string(), ''),
  REDIS_DB: optional(pipe(nonNegativeInteger, maxValue(15, 'Must not exceed 15')), '0'),

  // JWT
  JWT_ALGO: picklist([
    'HS256',
    'RS256',
    'ES256',
    'PS256',
    'HS384',
    'RS384',
    'ES384',
    'PS384',
    'HS512',
    'RS512',
    'ES512',
    'PS512'
  ]),
  ACCESS_TOKEN_SECRET: requiredString,
  REFRESH_TOKEN_SECRET: requiredString,
  ACCESS_TOKEN_EXPIRES_IN: requiredString,
  REFRESH_TOKEN_EXPIRES_IN: requiredString,

  // API Key
  API_KEY: requiredString,

  // OTP
  OTP_EXPIRES_AT: requiredString,

  // Google
  GOOGLE_CLIENT_ID: requiredString,
  GOOGLE_CLIENT_SECRET: requiredString,
  GOOGLE_REDIRECT_URI: urlString,

  // AWS
  AWS_ACCESS_KEY_ID: requiredString,
  AWS_SECRET_ACCESS_KEY: requiredString,
  AWS_REGION: requiredString,
  AWS_S3_BUCKET_NAME: requiredString,

  // Email (Resend)
  RESEND_API_KEY: requiredString,
  RESEND_FROM_ADDRESS: requiredString,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: requiredString,
  CLOUDINARY_API_KEY: requiredString,
  CLOUDINARY_API_SECRET: requiredString,

  // Sandbox Payments
  VNPAY_TMN_CODE: requiredString,
  VNPAY_SECURE_SECRET: requiredString,
  VNPAY_HOST: httpsOriginString,
  MOMO_PARTNER_CODE: requiredString,
  MOMO_ACCESS_KEY: requiredString,
  MOMO_SECRET_KEY: requiredString,
  MOMO_STORE_ID: requiredString,
  MOMO_STORE_NAME: requiredString,
  PAYMENT_PUBLIC_BASE_URL: httpsOriginString,

  // Rate Limit
  RATE_LIMIT_ENABLED: optional(booleanString, 'true'),
  RATE_LIMIT_WINDOW_MS: optional(pipe(positiveInteger, minValue(1000, 'Must be at least 1000')), '900000'),
  RATE_LIMIT_MAX: optional(positiveInteger, '100'),

  // System Health
  SYSTEM_HEALTH_MONITOR_ENABLED: optional(booleanString, 'true'),
  SYSTEM_HEALTH_CRON: requiredString,
  SYSTEM_HEALTH_TIMEZONE: requiredString,
  SYSTEM_HEALTH_DISK_PATH: requiredString,
  SYSTEM_HEALTH_CPU_WARN: percentage,
  SYSTEM_HEALTH_CPU_CRITICAL: percentage,
  SYSTEM_HEALTH_RAM_WARN: percentage,
  SYSTEM_HEALTH_RAM_CRITICAL: percentage,
  SYSTEM_HEALTH_DISK_WARN: percentage,
  SYSTEM_HEALTH_DISK_CRITICAL: percentage,
  SYSTEM_HEALTH_PROCESS_MEMORY_WARN_MB: positiveInteger,
  SYSTEM_HEALTH_PROCESS_MEMORY_CRITICAL_MB: positiveInteger,
  SYSTEM_HEALTH_ALERT_COOLDOWN_SECONDS: nonNegativeInteger,
  SYSTEM_HEALTH_ADMIN_EMAILS: requiredString
});

const result = safeParse(envSchema, process.env);

if (!result.success) {
  console.error('Invalid environment variables:', flatten(result.issues));
  throw new Error('Invalid environment configuration');
}

export const envConfig = result.output;
export const isDevelopment = envConfig.NODE_ENV === 'development';
export const isStaging = envConfig.NODE_ENV === 'staging';
export const isProduction = envConfig.NODE_ENV === 'production';
