import { CorsOptions } from 'cors';
import { Options as RateLimitOptions } from 'express-rate-limit';
import { type Algorithm, type Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms';

export interface IAppConfig {
  port: number;
  client: {
    url: string;
  };
  jwt: {
    algorithm: Algorithm;
    accessTokenSecret: Secret;
    refreshTokenSecret: Secret;
    accessTokenExpiresIn: StringValue;
    refreshTokenExpiresIn: StringValue;
  };
  logs: {
    level: string;
  };
  api: {
    prefix: string;
  };
  searchCache: {
    ttlSeconds: number;
  };
  cors?: CorsOptions;
  rateLimit?: Partial<RateLimitOptions> & { enabled: boolean };
}
