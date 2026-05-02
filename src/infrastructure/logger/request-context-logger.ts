import type { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';

type RequestLogContext = {
  requestId?: string;
  userId?: string;
};

class RequestContextLogger {
  private storage: AsyncLocalStorage<RequestLogContext>;

  constructor() {
    this.storage = new AsyncLocalStorage<RequestLogContext>();
  }

  public getStore(): RequestLogContext | undefined {
    return this.storage.getStore();
  }

  public run<T>(store: RequestLogContext, fn: () => T): T {
    return this.storage.run(store, fn);
  }

  public bindRequestLogContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
    const id = (req as Request & { id?: string | number }).id;
    const store: RequestLogContext = {
      requestId: id !== undefined && id !== '' ? String(id) : undefined
    };
    this.run(store, () => next());
  }

  public syncLogContextFromAuth(req: Request): void {
    const ctx = this.getStore();
    if (!ctx) return;
    const userId = req.tokenPayload?.userId;
    if (userId) ctx.userId = userId;
  }

  public syncLogContextFromUser(req: Request): void {
    const ctx = this.getStore();
    if (!ctx) return;
    if (req.user?.id) {
      ctx.userId = req.user.id;
    }
  }
}

const requestContextLogger = new RequestContextLogger();
export default requestContextLogger;
