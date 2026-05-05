import { OK, SuccessResponse } from '@/presentation/http/express/responses/success.response';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import { NextFunction, RequestHandler, Response } from 'express';

type ControllerResult<T = unknown> = SuccessResponse<T> | T | void;

type ControllerHandler<TRequest = ExpressRequest, TResponse = ExpressResponse, TNext = NextFunction> = (
  request: TRequest,
  response: TResponse,
  next: TNext
) => ControllerResult | Promise<ControllerResult>;

export class TransformResponseInterceptor {
  constructor() {
    this.intercept = this.intercept.bind(this);
  }

  intercept<TRequest, TResponse, TNext>(handler: ControllerHandler<TRequest, TResponse, TNext>): RequestHandler {
    return async (request: ExpressRequest, response: ExpressResponse, next: NextFunction) => {
      const result = await handler(request as TRequest, response as TResponse, next as TNext);
      this.send(response, result);
    };
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
