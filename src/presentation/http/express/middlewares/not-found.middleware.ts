import type { RequestHandler } from 'express';
import { HTTP_STATUS } from '@/presentation/http/express/responses/http-status.constant';
import { HTTP_ERROR_MESSAGE } from '@/presentation/http/express/responses/http-message.constant';

export const notFoundMiddleware: RequestHandler = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    message: HTTP_ERROR_MESSAGE.NOT_FOUND,
    errors: {
      method: req.method,
      path: req.originalUrl
    }
  });
};
