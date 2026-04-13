import { envConfig } from '@/bootstrap/config/env.config';

export const dbConfig = {
  database: {
    uri: envConfig.DATABASE_URI,
    name: envConfig.DATABASE_NAME,
    chatDatabaseName: envConfig.DATABASE_CHAT_NAME
  },

  redis: {
    host: envConfig.REDIS_HOST,
    port: parseInt(envConfig.REDIS_PORT, 10),
    password: envConfig.REDIS_PASSWORD || undefined,
    db: parseInt(envConfig.REDIS_DB, 10)
  }
};
