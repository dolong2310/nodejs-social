import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';
import { ErrorResponse } from '@/presentation/http/express/responses/error.response';
import { HTTP_ERROR_MESSAGE } from '@/presentation/http/express/responses/http-message.constant';
import { HTTP_STATUS } from '@/presentation/http/express/responses/http-status.constant';
import { NextFunction, Request, Response } from 'express';

export class HttpExceptionFilter {
  static catch(error: Error, request: Request, response: Response, next: NextFunction): void {
    void next; // only prevent eslint warning

    if (error instanceof ExceptionBase) {
      const { message, code, statusCode } = error.toJSON();
      response.status(statusCode).json({ message: message || code, errors: {} });
      return;
    }

    if (error instanceof ErrorResponse) {
      const { statusCode, message, errors = {} } = error;
      response.status(statusCode).json({ message, errors });
      return;
    }

    const statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error.message || HTTP_ERROR_MESSAGE.INTERNAL_SERVER_ERROR;

    request.log.error({ error }, 'Unhandled error');

    response.status(statusCode).json({ message, errors: {} });
  }
}
