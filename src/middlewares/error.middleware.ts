import HTTP_STATUS from '@/constants/httpStatus.constant';
import { ERROR_MESSAGE } from '@/constants/message.constant';
import { ErrorEntity, ErrorWithStatus } from '@/models/error.models';
import { NextFunction, Request, Response } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorEntity) {
    return res.status(err.status).json({ message: err.message, errors: err.errors });
  }
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json({ message: err.message, errors: {} });
  }

  const statusCode = err.httpCode || err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || ERROR_MESSAGE.INTERNAL_SERVER_ERROR;

  return res.status(statusCode).json({ message, errors: {} });
};
