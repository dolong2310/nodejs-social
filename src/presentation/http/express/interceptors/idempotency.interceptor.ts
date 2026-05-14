import { createHash } from 'node:crypto';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { BaseInterceptor } from '@/presentation/http/express/core/base.interceptor';
import { ConflictException } from '@/presentation/http/express/responses/error.response';
import { SuccessResponse } from '@/presentation/http/express/responses/success.response';
import type { ControllerResult, ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';

type IdempotencyInterceptorOptions = {
  ttlSeconds?: number;
  processingTtlSeconds?: number;
  prefix?: string;
};

type IdempotencyRecord = {
  requestHash: string;
  result: StoredControllerResult;
};

type StoredControllerResult =
  | {
      type: 'success-response';
      message: string;
      statusCode: number;
      data: unknown;
    }
  | {
      type: 'raw';
      result: ControllerResult;
    };

export class IdempotencyInterceptor implements BaseInterceptor {
  private readonly ttlSeconds: number;
  private readonly processingTtlSeconds: number;
  private readonly prefix: string;

  constructor(
    private readonly cacheManager: CacheManagerPort,
    options: IdempotencyInterceptorOptions = {}
  ) {
    this.ttlSeconds = options.ttlSeconds ?? 86400;
    this.processingTtlSeconds = options.processingTtlSeconds ?? 60;
    this.prefix = options.prefix ?? 'idempotency';
  }

  async intercept(req: ExpressRequest, res: ExpressResponse, next: () => Promise<unknown>) {
    const idempotencyKey = this.getIdempotencyKey(req);

    if (!idempotencyKey || !this.shouldApply(req)) {
      return next();
    }

    const requestHash = this.getRequestHash(req);
    const resultKey = this.getResultKey(req, idempotencyKey);
    const lockKey = `${resultKey}:lock`;
    const cached = await this.cacheManager.get<IdempotencyRecord>(resultKey);

    if (cached) {
      if (cached.requestHash !== requestHash) {
        throw new ConflictException('Idempotency key was reused with a different request');
      }
      res.setHeader('Idempotency-Replayed', 'true');
      return this.restoreResult(cached.result);
    }

    const lock = await this.cacheManager.acquireLock(lockKey, this.processingTtlSeconds * 1000);

    if (!lock) {
      throw new ConflictException('Request with this idempotency key is already processing');
    }

    try {
      const result = await next();
      if (!res.headersSent && result !== undefined) {
        await this.cacheManager.set<IdempotencyRecord>(
          resultKey,
          {
            requestHash,
            result: this.serializeResult(result)
          },
          { ttlSeconds: this.ttlSeconds }
        );
      }
      return result;
    } finally {
      await this.cacheManager.releaseLock(lockKey, lock.token);
    }
  }

  private shouldApply(req: ExpressRequest): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  }

  private getIdempotencyKey(req: ExpressRequest): string | undefined {
    const value = req.headers['idempotency-key'];
    return Array.isArray(value) ? value[0] : value;
  }

  private getResultKey(req: ExpressRequest, idempotencyKey: string): string {
    const userScope = req.tokenPayload?.userId ?? req.user?.id ?? 'guest';
    const path = req.originalUrl ?? req.url;
    return `${this.prefix}:${userScope}:${req.method}:${path}:${idempotencyKey}`;
  }

  private getRequestHash(req: ExpressRequest): string {
    return createHash('sha256')
      .update(
        JSON.stringify({
          method: req.method,
          path: req.originalUrl ?? req.url,
          body: req.body,
          query: req.query,
          params: req.params
        })
      )
      .digest('hex');
  }

  private serializeResult(result: ControllerResult): StoredControllerResult {
    if (result instanceof SuccessResponse) {
      return {
        type: 'success-response',
        message: result.message,
        statusCode: result.statusCode,
        data: result.data
      };
    }

    return {
      type: 'raw',
      result
    };
  }

  private restoreResult(result: StoredControllerResult): ControllerResult {
    if (result.type === 'success-response') {
      return new SuccessResponse({
        message: result.message,
        statusCode: result.statusCode,
        data: result.data
      });
    }

    return result.result;
  }
}
