import {
  BaseInterceptor,
  CallHandler,
  ControllerResult,
  InterceptorContext
} from '@/presentation/http/express/interceptors/base.interceptor';
import { OK, SuccessResponse } from '@/presentation/http/express/responses/success.response';
import { ExpressResponse } from '@/presentation/http/express/types';
import { Response } from 'express';

export class TransformResponseInterceptor implements BaseInterceptor {
  async intercept<TRequest, TResponse, TNext>(
    context: InterceptorContext<TRequest, TResponse, TNext>,
    next: CallHandler
  ) {
    const result = await next.handle();
    this.send(context.response as ExpressResponse, result);
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
