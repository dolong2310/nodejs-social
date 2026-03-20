import { envConfig, isDevelopment, isProduction } from '@/config/envConfig';
import { type Algorithm, type Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms';

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
  }
};
