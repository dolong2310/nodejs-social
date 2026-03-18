import argv from 'minimist';
import dotenv from 'dotenv';

const envArgs = argv(process.argv.slice(2));

export const isDevelopment = envArgs.env === 'development';
export const isStaging = envArgs.env === 'staging';
export const isProduction = envArgs.env === 'production';

dotenv.config({
  path: envArgs.env ? `.env.${envArgs.env}` : '.env'
});

export const envConfig: Record<string, string> = {
  PORT: process.env.PORT as string,
  PRODUCTION_URL: process.env.PRODUCTION_URL as string,
  DEVELOPMENT_URL: process.env.DEVELOPMENT_URL as string,
  MONGODB_URI: process.env.MONGODB_URI as string,
  DATABASE_NAME: process.env.DATABASE_NAME as string,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
  EMAIL_TOKEN_SECRET: process.env.EMAIL_TOKEN_SECRET as string,
  FORGOT_PASSWORD_TOKEN_SECRET: process.env.FORGOT_PASSWORD_TOKEN_SECRET as string,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN as string,
  EMAIL_TOKEN_EXPIRES_IN: process.env.EMAIL_TOKEN_EXPIRES_IN as string,
  FORGOT_PASSWORD_TOKEN_EXPIRES_IN: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as string,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
  FRONTEND_URL: process.env.FRONTEND_URL as string,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID as string,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY as string,
  AWS_REGION: process.env.AWS_REGION as string,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME as string,
  SES_FROM_ADDRESS: process.env.SES_FROM_ADDRESS as string
};
