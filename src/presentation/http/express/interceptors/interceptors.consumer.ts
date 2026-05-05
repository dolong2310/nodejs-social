import {
  BaseInterceptor,
  ControllerHandler,
  ControllerResult,
  InterceptorContext
} from '@/presentation/http/express/interceptors/base.interceptor';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import { NextFunction, RequestHandler } from 'express';

export class InterceptorsConsumer {
  static create(interceptors: BaseInterceptor[]) {
    const consumer = new InterceptorsConsumer();

    return <TRequest, TResponse, TNext>(handler: ControllerHandler<TRequest, TResponse, TNext>): RequestHandler =>
      consumer.intercept(handler, interceptors);
  }

  intercept<TRequest, TResponse, TNext>(
    handler: ControllerHandler<TRequest, TResponse, TNext>,
    interceptors: BaseInterceptor[]
  ): RequestHandler {
    return async (request: ExpressRequest, response: ExpressResponse, next: NextFunction) => {
      const context: InterceptorContext<TRequest, TResponse, TNext> = {
        request: request as TRequest,
        response: response as TResponse,
        next: next as TNext,
        handler,
        handlerName: handler.name || 'anonymous'
      };

      await this.dispatch(context, interceptors, 0);
    };
  }

  private dispatch<TRequest, TResponse, TNext>(
    context: InterceptorContext<TRequest, TResponse, TNext>,
    interceptors: BaseInterceptor[],
    index: number
  ): Promise<ControllerResult> {
    if (index >= interceptors.length) {
      return Promise.resolve(context.handler(context.request, context.response, context.next));
    }

    const next = {
      handle: () => this.dispatch(context, interceptors, index + 1)
    };

    return Promise.resolve(interceptors[index].intercept(context, next));
  }
}
