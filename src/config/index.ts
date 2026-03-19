import dotenv from 'dotenv';
import { type Algorithm, type Secret } from 'jsonwebtoken';
import argv from 'minimist';
import type { StringValue } from 'ms';

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

export const envConfig: Record<string, string> = {
  // App configs
  PORT: process.env.PORT!,
  PRODUCTION_URL: process.env.PRODUCTION_URL!,
  DEVELOPMENT_URL: process.env.DEVELOPMENT_URL!,
  MONGODB_URI: process.env.MONGODB_URI!,
  DATABASE_NAME: process.env.DATABASE_NAME!,

  // JWT configs
  JWT_ALGO: process.env.JWT_ALGO!,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
  EMAIL_TOKEN_SECRET: process.env.EMAIL_TOKEN_SECRET!,
  FORGOT_PASSWORD_TOKEN_SECRET: process.env.FORGOT_PASSWORD_TOKEN_SECRET!,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN!,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN!,
  EMAIL_TOKEN_EXPIRES_IN: process.env.EMAIL_TOKEN_EXPIRES_IN!,
  FORGOT_PASSWORD_TOKEN_EXPIRES_IN: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN!,

  // Third-party configs
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
  FRONTEND_URL: process.env.FRONTEND_URL!,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
  AWS_REGION: process.env.AWS_REGION!,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME!,
  SES_FROM_ADDRESS: process.env.SES_FROM_ADDRESS!
};

export const config = {
  port: parseInt(envConfig.PORT, 10),

  database: {
    uri: envConfig.MONGODB_URI,
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

  logs: {
    level: process.env.LOG_LEVEL || 'silly'
  },

  api: {
    prefix: '/api'
  }
};
