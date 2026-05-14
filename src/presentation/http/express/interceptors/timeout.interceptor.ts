import { BaseInterceptor } from '@/presentation/http/express/core/base.interceptor';
import { RequestTimeoutException } from '@/presentation/http/express/responses/error.response';
import type { ControllerResult, ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';

const DEFAULT_TIMEOUT_MS = 30000;

type TimeoutInterceptorOptions = {
  timeoutMs?: number;
};

export class TimeoutInterceptor implements BaseInterceptor {
  private readonly timeoutMs: number;

  constructor(options: TimeoutInterceptorOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async intercept(
    _req: ExpressRequest,
    _res: ExpressResponse,
    next: () => Promise<unknown>
  ): Promise<ControllerResult> {
    let timeoutId: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new RequestTimeoutException());
      }, this.timeoutMs);
    });

    try {
      return await Promise.race([next(), timeout]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }
}
