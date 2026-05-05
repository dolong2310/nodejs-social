import { Request, RequestHandler, Response } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export type RequestHandlerType = RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
export type ExpressRequest = Request<ParamsDictionary, unknown, unknown, ParsedQs, Record<string, unknown>>;
export type ExpressResponse = Response<unknown, Record<string, unknown>>;
