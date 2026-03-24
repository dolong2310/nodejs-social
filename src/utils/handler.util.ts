import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

export const asyncHandler = <
  Params = ParamsDictionary,
  ResBody = object,
  ReqBody = object,
  ReqQuery = ParsedQs,
  Locals extends Record<string, unknown> = Record<string, unknown>
>(
  fn: RequestHandler<Params, ResBody, ReqBody, ReqQuery, Locals>
) => {
  return async (
    req: Request<Params, ResBody, ReqBody, ReqQuery, Locals>,
    res: Response<ResBody, Locals>,
    next: NextFunction
  ) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// import { NextFunction, Request, Response, RequestHandler } from 'express';

// export const asyncHandler = (fn: RequestHandler) => {
//   return async (req: Request, res: Response, next: NextFunction) => {
//     // Promise.resolve(fn(req, res, next)).catch(next);
//     try {
//       await fn(req, res, next);
//     } catch (error) {
//       next(error);
//     }
//   };
// };
