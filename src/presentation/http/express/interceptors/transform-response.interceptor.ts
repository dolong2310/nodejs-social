import { BaseInterceptor } from '@/presentation/http/express/core/base.interceptor';
import { OK, SuccessResponse } from '@/presentation/http/express/responses/success.response';
import type { ControllerResult, ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import { Response } from 'express';

export class TransformResponseInterceptor implements BaseInterceptor {
  async intercept(_req: ExpressRequest, res: ExpressResponse, next: () => Promise<unknown>) {
    const result = await next();
    this.send(res, result);
    return result;
  }

  private send<T>(response: Response, result: ControllerResult<T>): void {
    if (response.headersSent || result === undefined) {
      return;
    }

    if (result instanceof SuccessResponse) {
      result.send(response);
      return;
    }

    new OK({ data: result }).send(response);
  }
}
