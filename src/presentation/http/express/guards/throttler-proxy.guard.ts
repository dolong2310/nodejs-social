import { IAppConfig } from '@/bootstrap/types/app.types';
import { RedisClientPort } from '@/infrastructure/persistence/redis/redis-client';
import { createRateLimitStore } from '@/infrastructure/persistence/redis/rate-limit-store';
import { RATE_LIMIT_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { HTTP_ERROR_MESSAGE } from '@/presentation/http/express/responses/http-message.constants';
import { HTTP_STATUS } from '@/presentation/http/express/responses/http-status.constants';
import { Request, type RequestHandler } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export type ThrottlePolicy = Readonly<{
  key: string;
  windowMs: number;
  limit: number;
}>;

const skipRateLimit: RequestHandler = (_req, _res, next) => next();

export class ThrottlerProxyGuard {
  constructor(
    private readonly appConfig: IAppConfig,
    private readonly redis: RedisClientPort
  ) {
    this.handler = this.handler.bind(this);
  }

  handler(policy: ThrottlePolicy, message: string = RATE_LIMIT_ERROR_MESSAGE.TOO_MANY_REQUESTS): RequestHandler {
    if (!this.appConfig.rateLimit.enabled) {
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
      standardHeaders: this.appConfig.rateLimit.standardHeaders,
      legacyHeaders: this.appConfig.rateLimit.legacyHeaders,
      store: createRateLimitStore(this.redis, policy.key),
      keyGenerator: (req: Request) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const { ipv6Subnet } = this.appConfig.rateLimit;
        return ipKeyGenerator(ip, typeof ipv6Subnet === 'number' || ipv6Subnet === false ? ipv6Subnet : undefined);
      }
    });
  }
}
