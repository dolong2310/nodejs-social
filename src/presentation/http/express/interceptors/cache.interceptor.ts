import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { BaseInterceptor } from '@/presentation/http/express/core/base.interceptor';
import { SuccessResponse } from '@/presentation/http/express/responses/success.response';
import type { ControllerResult, ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';

type CacheInterceptorOptions = {
  ttlSeconds?: number;
  prefix?: string;
};

type CachedControllerResult =
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

export class CacheInterceptor implements BaseInterceptor {
  private readonly ttlSeconds: number;
  private readonly prefix: string;

  constructor(
    private readonly cacheManager: CacheManagerPort,
    options: CacheInterceptorOptions = {}
  ) {
    this.ttlSeconds = options.ttlSeconds ?? 60;
    this.prefix = options.prefix ?? 'http-cache';
  }

  async intercept(req: ExpressRequest, res: ExpressResponse, next: () => Promise<unknown>) {
    if (!this.shouldCache(req)) {
      return next();
    }

    const key = this.getCacheKey(req);
    const cached = await this.cacheManager.get<CachedControllerResult>(key);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return this.restoreResult(cached);
    }

    res.setHeader('X-Cache', 'MISS');
    const result = await next();

    if (!res.headersSent && result !== undefined) {
      await this.cacheManager.set<CachedControllerResult>(key, this.serializeResult(result), {
        ttlSeconds: this.ttlSeconds
      });
    }

    return result;
  }

  private shouldCache(req: ExpressRequest): boolean {
    if (req.method !== 'GET') return false;

    const cacheControl = req.headers['cache-control'];
    const raw = Array.isArray(cacheControl) ? cacheControl.join(',') : cacheControl;
    return !raw?.includes('no-cache');
  }

  private getCacheKey(req: ExpressRequest): string {
    const userScope = req.tokenPayload?.userId ?? req.user?.id ?? 'guest';
    const path = req.originalUrl ?? req.url;
    return `${this.prefix}:${userScope}:${req.method}:${path}`;
  }

  private serializeResult(result: ControllerResult): CachedControllerResult {
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

  private restoreResult(cached: CachedControllerResult): ControllerResult {
    if (cached.type === 'success-response') {
      return new SuccessResponse({
        message: cached.message,
        statusCode: cached.statusCode,
        data: cached.data
      });
    }

    return cached.result;
  }
}
