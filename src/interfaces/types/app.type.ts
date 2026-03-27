import { CorsOptions } from 'cors';
import { Options as RateLimitOptions } from 'express-rate-limit';
import type { RedisOptions } from 'ioredis';

export interface AppConfig {
  database: {
    uri: string;
    databaseName: string;
    chatDatabaseName: string;
  };
  redis: RedisOptions;
  cors?: CorsOptions;
  rateLimitOptions?: Partial<RateLimitOptions>;
}
