import HTTP_STATUS from '@/constants/httpStatus.constant';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { ErrorWithStatus } from '@/models/error.model';
import { NextFunction, Request, Response } from 'express';

export const checkAuthWrapper = (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      return handler(req, res, next);
    }
    next();
  };
};

export const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) {
    throw new ErrorWithStatus({
      message: VALIDATION_ERROR_MESSAGE.AUTHORIZATION_IS_REQUIRED,
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }
  next();
};
