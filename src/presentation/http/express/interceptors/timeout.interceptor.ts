import {
  BaseInterceptor,
  CallHandler,
  ControllerResult
} from '@/presentation/http/express/interceptors/base.interceptor';
import { RequestTimeoutException } from '@/presentation/http/express/responses/error.response';

const DEFAULT_TIMEOUT_MS = 30000;

type TimeoutInterceptorOptions = {
  timeoutMs?: number;
};

export class TimeoutInterceptor implements BaseInterceptor {
  private readonly timeoutMs: number;

  constructor(options: TimeoutInterceptorOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async intercept(_context: unknown, next: CallHandler): Promise<ControllerResult> {
    let timeoutId: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new RequestTimeoutException());
      }, this.timeoutMs);
    });

    try {
      return await Promise.race([next.handle(), timeout]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }
}
