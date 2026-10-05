import { APP_CONFIG } from '@/bootstrap/config/app.config';
import { envConfig } from '@/bootstrap/config/env.config';
import type { RedisClientPort } from '@/infrastructure/persistence/redis/redis-client';
import { createRateLimitStore } from '@/infrastructure/persistence/redis/rate-limit-store';
import { RATE_LIMIT_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { HTTP_ERROR_MESSAGE } from '@/presentation/http/express/responses/http-message.constants';
import { HTTP_STATUS } from '@/presentation/http/express/responses/http-status.constants';
import type { Request, RequestHandler } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export type ThrottlePolicy = Readonly<{
  key: string;
  windowMs: number;
  limit: number;
}>;

const skipRateLimit: RequestHandler = (_req, _res, next) => next();

export class ThrottlerProxyGuard {
  constructor(private readonly redis: RedisClientPort) {
    this.handler = this.handler.bind(this);
  }

  handler(policy: ThrottlePolicy, message: string = RATE_LIMIT_ERROR_MESSAGE.TOO_MANY_REQUESTS): RequestHandler {
    if (!envConfig.RATE_LIMIT_ENABLED) {
      return skipRateLimit;
    }

    return rateLimit({
      windowMs: policy.windowMs,
      limit: policy.limit,
      message: {
        statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
        error: HTTP_ERROR_MESSAGE.TOO_MANY_REQUESTS,
        message
      },
      standardHeaders: APP_CONFIG.RATE_LIMIT.STANDARD_HEADERS,
      legacyHeaders: APP_CONFIG.RATE_LIMIT.LEGACY_HEADERS,
      store: createRateLimitStore(this.redis, policy.key),
      keyGenerator: (req: Request) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const ipv6Subnet = APP_CONFIG.RATE_LIMIT.IPV6_SUBNET;
        return ipKeyGenerator(ip, typeof ipv6Subnet === 'number' || ipv6Subnet === false ? ipv6Subnet : undefined);
      }
    });
  }
}
