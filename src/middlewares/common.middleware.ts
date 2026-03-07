import { Request, Response, NextFunction } from 'express';
import { pick } from 'lodash-es';

export const filterBodyMiddleware =
  <T>(filterKeys: (keyof T)[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys as string[]);
    next();
  };
