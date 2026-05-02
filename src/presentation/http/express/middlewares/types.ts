import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';

export type RequestHandlerType = RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
