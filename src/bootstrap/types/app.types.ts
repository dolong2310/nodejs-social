import type { CorsOptions } from 'cors';
import type { Options as RateLimitOptions } from 'express-rate-limit';
import type { Algorithm, Secret } from 'jsonwebtoken';
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
    apiKey: string;
    fromAddress: string;
  };
  systemHealth: {
    enabled: boolean;
    cron: string;
    timezone: string;
    diskPath: string;
    adminEmails: string[];
    alertCooldownSeconds: number;
    thresholds: {
      cpu: {
        warning: number;
        critical: number;
      };
      memory: {
        warning: number;
        critical: number;
      };
      disk: {
        warning: number;
        critical: number;
      };
      processMemoryMb: {
        warning: number;
        critical: number;
      };
    };
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
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  payment: {
    vnpay: {
      tmnCode: string;
      secureSecret: string;
      vnpayHost: string;
    };
    momo: {
      partnerCode: string;
      accessKey: string;
      secretKey: string;
      storeId: string;
      storeName: string;
    };
    paymentPublicBaseUrl: string;
  };
}
