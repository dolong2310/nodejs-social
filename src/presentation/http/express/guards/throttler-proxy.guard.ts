import { IAppConfig } from '@/bootstrap/types/app.type';
import { RATE_LIMIT_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { THROTTLE } from '@/presentation/http/express/constants/throttler.constant';
import { HTTP_ERROR_MESSAGE } from '@/presentation/http/express/responses/http-message.constant';
import { HTTP_STATUS } from '@/presentation/http/express/responses/http-status.constant';
import { Request, type RequestHandler } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const skipRateLimit: RequestHandler = (_req, _res, next) => next();

export class ThrottlerProxyGuard {
  constructor(private readonly appConfig: IAppConfig) {
    this.handler = this.handler.bind(this);
  }

  handler(
    windowMs: number = THROTTLE.DEFAULT.WINDOW_MS,
    max: number = THROTTLE.DEFAULT.MAX,
    message: string = RATE_LIMIT_ERROR_MESSAGE.TOO_MANY_REQUESTS
  ): RequestHandler {
    if (!this.appConfig.rateLimit.enabled) {
      return skipRateLimit;
    }
    return rateLimit({
      windowMs,
      max,
      message: {
        statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
        error: HTTP_ERROR_MESSAGE.TOO_MANY_REQUESTS,
        message
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        return ipKeyGenerator(ip);
      }
    });
  }
}
