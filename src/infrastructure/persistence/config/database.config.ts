import { envConfig } from '@/bootstrap/config/env.config';
import { EnumDatabaseDriver } from '@/infrastructure/persistence/database.port';

export const dbConfig = {
  driver: envConfig.PERSISTENCE_DRIVER as EnumDatabaseDriver,

  mongodb: {
    uri: envConfig.MONGO_URI ?? '',
    name: envConfig.MONGO_DB_NAME ?? ''
  },

  postgres: {
    uri: envConfig.POSTGRES_URI ?? '',
    ssl: envConfig.POSTGRES_SSL === 'true'
  },

  redis: {
    host: envConfig.REDIS_HOST,
    port: parseInt(envConfig.REDIS_PORT, 10),
    password: envConfig.REDIS_PASSWORD || undefined,
    db: parseInt(envConfig.REDIS_DB, 10)
  }
};
