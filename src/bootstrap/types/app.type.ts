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
  auth: {
    apiKey: string;
  };
  logs: {
    level: string;
  };
  api: {
    prefix: string;
  };
  cors: CorsOptions;
  rateLimit: Partial<RateLimitOptions> & { enabled: boolean };
  email: {
    fromAddress: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  s3: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
  };
}
