import { ErrorResponse } from '@/presentation/http/responses/error.response';
import { HTTP_ERROR_MESSAGE } from '@/presentation/http/responses/http-message.constant';
import { HTTP_STATUS } from '@/presentation/http/responses/http-status.constant';

import { NextFunction, Request, Response } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ErrorResponse) {
    return res.status(err.statusCode).json({ message: err.message, errors: err.errors || {} });
  }

  const statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || HTTP_ERROR_MESSAGE.INTERNAL_SERVER_ERROR;

  req.log.error({ err }, 'unhandled error');

  return res.status(statusCode).json({ message, errors: {} });
};
