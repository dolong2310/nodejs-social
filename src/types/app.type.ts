import { CorsOptions } from 'cors';
import { Options as RateLimitOptions } from 'express-rate-limit';

export interface AppConfig {
  database: {
    uri: string;
    databaseName: string;
  };
  cors?: CorsOptions;
  rateLimitOptions?: Partial<RateLimitOptions>;
}
