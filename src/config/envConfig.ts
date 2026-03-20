import dotenv from 'dotenv';
import argv from 'minimist';

const envArgs = argv(process.argv.slice(2));

export const isDevelopment = envArgs.env === 'development';
export const isStaging = envArgs.env === 'staging';
export const isProduction = envArgs.env === 'production';

const envFound = dotenv.config({
  path: envArgs.env ? `.env.${envArgs.env}` : '.env'
});

if (envFound.error) {
  // This error should crash whole process
  throw new Error(`Couldn't find .env.${envArgs.env} file`);
}

const ENV_KEYS = [
  // App configs
  'PORT',
  'REDIS_HOST',
  'REDIS_PORT',
  'REDIS_PASSWORD',
  'REDIS_DB',
  'PRODUCTION_URL',
  'DEVELOPMENT_URL',
  'DATABASE_URI',
  'DATABASE_NAME',

  // JWT configs
  'JWT_ALGO',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
  'EMAIL_TOKEN_SECRET',
  'FORGOT_PASSWORD_TOKEN_SECRET',
  'ACCESS_TOKEN_EXPIRES_IN',
  'REFRESH_TOKEN_EXPIRES_IN',
  'EMAIL_TOKEN_EXPIRES_IN',
  'FORGOT_PASSWORD_TOKEN_EXPIRES_IN',

  // Third-party configs
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'FRONTEND_URL',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_S3_BUCKET_NAME',
  'SES_FROM_ADDRESS'
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
