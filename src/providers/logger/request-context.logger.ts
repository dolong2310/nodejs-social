import type { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';

type RequestLogContext = {
  requestId?: string;
  userId?: string;
};

export class RequestContextLogger {
  private static storage = new AsyncLocalStorage<RequestLogContext>();

  public static getStore(): RequestLogContext | undefined {
    return this.storage.getStore();
  }

  public static run<T>(store: RequestLogContext, fn: () => T): T {
    return this.storage.run(store, fn);
  }

  public static bindRequestLogContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
    const id = (req as Request & { id?: string | number }).id;
    const store: RequestLogContext = {
      requestId: id !== undefined && id !== '' ? String(id) : undefined
    };
    RequestContextLogger.run(store, () => next());
  }

  public static syncLogContextFromAuth(req: Request): void {
    const ctx = this.getStore();
    if (!ctx) return;
    const userId = req.tokenPayload?.userId;
    if (userId) ctx.userId = userId;
  }

  public static syncLogContextFromUser(req: Request): void {
    const ctx = this.getStore();
    if (!ctx) return;
    if (req.user?._id) {
      ctx.userId = req.user._id.toString();
    }
  }
}
