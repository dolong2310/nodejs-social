import dotenv from 'dotenv';
import argv from 'minimist';
import { existsSync } from 'node:fs';

const envArgs = argv(process.argv.slice(2));
const envMode = envArgs.env;

export const isDevelopment = envMode === 'development';
export const isStaging = envMode === 'staging';
export const isProduction = envMode === 'production';

const envPath = envMode ? `.env.${envMode}` : '.env';
if (existsSync(envPath)) {
  const envFound = dotenv.config({ path: envPath });
  if (envFound.error) {
    throw new Error(`Failed to read ${envPath}: ${envFound.error.message}`);
  }
}

const ENV_KEYS = [
  // App
  'PORT',
  'LOG_LEVEL',
  'FRONTEND_URL',
  'APP_URL',

  // CORS
  'CORS_ORIGINS',

  // Database
  'PERSISTENCE_DRIVER',
  'MONGO_URI',
  'MONGO_SECONDARY_URI',
  'MONGO_DB_NAME',
  'POSTGRES_URI',
  'POSTGRES_REPLICA_URIS',
  'POSTGRES_SSL',

  // Redis
  'REDIS_HOST',
  'REDIS_PORT',
  'REDIS_PASSWORD',
  'REDIS_DB',

  // JWT
  'JWT_ALGO',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
  'ACCESS_TOKEN_EXPIRES_IN',
  'REFRESH_TOKEN_EXPIRES_IN',

  // API Key
  'API_KEY',

  // OTP
  'OTP_EXPIRES_AT',

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

  // Rate Limit
  'RATE_LIMIT_ENABLED',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX'
] as const;

type EnvKey = (typeof ENV_KEYS)[number];
type EnvConfig = Record<EnvKey, string>;

export const envConfig = ENV_KEYS.reduce((acc, key) => {
  const value = process.env[key];
  if (typeof value === 'undefined' || value === '') {
    throw new Error(`Missing environment variable: ${key}`);
  }
  acc[key] = value;
  return acc;
}, {} as EnvConfig);
