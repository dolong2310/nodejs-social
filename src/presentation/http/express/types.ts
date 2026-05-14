/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SuccessResponse } from '@/presentation/http/express/responses/success.response';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export type ExpressRequestHandler = RequestHandler<ParamsDictionary, unknown, unknown, Query, Record<string, unknown>>;

export type ExpressRequest<
  TParams extends ParamsDictionary = any,
  TResBody = any,
  TReqBody = any,
  TQuery extends ParsedQs = any,
  TLocals extends Record<string, unknown> = Record<string, unknown>
> = Request<TParams, TResBody, TReqBody, TQuery, TLocals>;

export type ExpressResponse = Response<unknown, Record<string, unknown>>;

export type ControllerResult<T = unknown> = SuccessResponse<T> | T | void;

export type ControllerHandler<TRequest = ExpressRequest, TResponse = ExpressResponse, TNext = NextFunction> = (
  request: TRequest,
  response: TResponse,
  next: TNext
) => ControllerResult | Promise<ControllerResult>;
