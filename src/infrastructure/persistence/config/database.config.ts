import { envConfig } from '@/bootstrap/config/env.config';
import type { EnumDatabaseDriver } from '@/infrastructure/persistence/database.port';

export const dbConfig = {
  driver: envConfig.DATABASE_ADAPTER as EnumDatabaseDriver,

  mongodb: {
    uri: envConfig.MONGO_URI,
    readUri: envConfig.MONGO_SECONDARY_URI || envConfig.MONGO_URI,
    name: envConfig.MONGO_DB_NAME ?? ''
  },

  postgres: {
    uri: envConfig.POSTGRES_URI,
    readUris:
      envConfig.POSTGRES_REPLICA_URIS.split(',')
        .map((item) => item.trim())
        .filter(Boolean) ?? [], // parse comma separated string to array example: 'uri1,uri2,uri3' > [uri1, uri2, uri3]
    ssl: envConfig.POSTGRES_SSL
  },

  redis: {
    host: envConfig.REDIS_HOST,
    port: envConfig.REDIS_PORT,
    password: envConfig.REDIS_PASSWORD || undefined,
    db: envConfig.REDIS_DB
  }
};
