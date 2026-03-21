import type { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestLogContext = {
  requestId?: string;
  userId?: string;
};

const storage = new AsyncLocalStorage<RequestLogContext>();

export function getRequestLogContext(): RequestLogContext | undefined {
  return storage.getStore();
}

export function runWithRequestLogContext<T>(store: RequestLogContext, fn: () => T): T {
  return storage.run(store, fn);
}

/** Call after pino-http so `req.id` exists. */
export function bindRequestLogContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const id = (req as Request & { id?: string | number }).id;
  const store: RequestLogContext = {
    requestId: id !== undefined && id !== '' ? String(id) : undefined
  };
  runWithRequestLogContext(store, () => next());
}

export function syncLogContextFromAuth(req: Request): void {
  const ctx = storage.getStore();
  if (!ctx) return;
  const userId = req.tokenPayload?.userId;
  if (userId) ctx.userId = userId;
}

export function syncLogContextFromUser(req: Request): void {
  const ctx = storage.getStore();
  if (!ctx) return;
  if (req.user?._id) {
    ctx.userId = req.user._id.toString();
  }
}
