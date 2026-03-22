import dotenv from 'dotenv';
import argv from 'minimist';

const envArgs = argv(process.argv.slice(2));
/** Vitest sets `VITEST`; avoid passing `--env` on the same argv as the Vitest CLI (unknown option). */
const envMode = envArgs.env ?? (process.env.VITEST ? 'development' : undefined);

export const isDevelopment = envMode === 'development';
export const isStaging = envMode === 'staging';
export const isProduction = envMode === 'production';

const envFound = dotenv.config({
  path: envMode ? `.env.${envMode}` : '.env'
});

if (envFound.error) {
  // This error should crash whole process
  throw new Error(`Couldn't find .env.${envMode} file`);
}

const ENV_KEYS = [
  // App
  'PORT',
  'LOG_LEVEL',
  'FRONTEND_URL',
  'PRODUCTION_URL',
  'DEVELOPMENT_URL',

  // Database
  'DATABASE_URI',
  'DATABASE_NAME',
  'DATABASE_CHAT_NAME',

  // JWT
  'JWT_ALGO',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
  'EMAIL_TOKEN_SECRET',
  'FORGOT_PASSWORD_TOKEN_SECRET',
  'ACCESS_TOKEN_EXPIRES_IN',
  'REFRESH_TOKEN_EXPIRES_IN',
  'EMAIL_TOKEN_EXPIRES_IN',
  'FORGOT_PASSWORD_TOKEN_EXPIRES_IN',

  // Google
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',

  // AWS
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_S3_BUCKET_NAME',
  'SES_FROM_ADDRESS',

  // Redis
  'REDIS_HOST',
  'REDIS_PORT',
  'REDIS_PASSWORD',
  'REDIS_DB',

  // Rate Limit
  'RATE_LIMIT_ENABLED',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX',

  // Cache
  'SEARCH_CACHE_TTL_SECONDS'
] as const;

type EnvKey = (typeof ENV_KEYS)[number];

export type EnvConfig = Record<EnvKey, string>;

export const envConfig = ENV_KEYS.reduce((acc, key) => {
  const value = process.env[key];
  if (typeof value === 'undefined' || value === '') {
    throw new Error(`Missing environment variable: ${key}`);
  }
  acc[key] = value;
  return acc;
}, {} as EnvConfig);
