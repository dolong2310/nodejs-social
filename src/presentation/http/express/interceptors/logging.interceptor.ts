import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';
import { BaseInterceptor } from '@/presentation/http/express/core/base.interceptor';
import { HttpException } from '@/presentation/http/express/responses/error.response';
import { HTTP_STATUS } from '@/presentation/http/express/responses/http-status.constant';
import type { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import { performance } from 'node:perf_hooks';

export class LoggingInterceptor implements BaseInterceptor {
  constructor(private readonly logger: LoggerPort) {}

  async intercept(req: ExpressRequest, res: ExpressResponse, next: () => Promise<unknown>) {
    const startedAt = performance.now();

    const logPayload = {
      method: req.method,
      path: req.originalUrl
    };
    const logOnFinish = () => {
      this.logger.info(
        {
          ...logPayload,
          statusCode: res.statusCode,
          durationMs: this.getDurationMs(startedAt)
        },
        'controller handled'
      );
    };

    this.logger.debug(logPayload, 'controller handling started');
    res.once('finish', logOnFinish);

    try {
      return await next();
    } catch (error) {
      res.off('finish', logOnFinish);
      const durationMs = this.getDurationMs(startedAt);
      const statusCode = this.getErrorStatusCode(error);
      const payload = {
        ...logPayload,
        err: error,
        statusCode,
        durationMs
      };

      if (statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
        this.logger.error(payload, 'controller handling failed');
      } else {
        this.logger.warn(payload, 'controller handling rejected');
      }

      throw error;
    }
  }

  private getDurationMs(startedAt: number): number {
    return Math.round(performance.now() - startedAt);
  }

  private getErrorStatusCode(error: unknown): number {
    if (error instanceof ExceptionBase) {
      return error.statusCode;
    }

    if (error instanceof HttpException) {
      return error.statusCode;
    }

    return HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }
}
