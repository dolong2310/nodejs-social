import type { SuccessResponse } from '@/presentation/http/express/responses/success.response';
import type { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import type { NextFunction } from 'express';

export type ControllerResult<T = unknown> = SuccessResponse<T> | T | void;

export type ControllerHandler<TRequest = ExpressRequest, TResponse = ExpressResponse, TNext = NextFunction> = (
  request: TRequest,
  response: TResponse,
  next: TNext
) => ControllerResult | Promise<ControllerResult>;

export interface CallHandler<T = ControllerResult> {
  handle(): T | Promise<T>;
}

export type InterceptorContext<TRequest = ExpressRequest, TResponse = ExpressResponse, TNext = NextFunction> = {
  request: TRequest;
  response: TResponse;
  next: TNext;
  handler: ControllerHandler<TRequest, TResponse, TNext>;
  handlerName: string;
};

export interface BaseInterceptor {
  intercept<TRequest = ExpressRequest, TResponse = ExpressResponse, TNext = NextFunction>(
    context: InterceptorContext<TRequest, TResponse, TNext>,
    next: CallHandler
  ): ControllerResult | Promise<ControllerResult>;
}
