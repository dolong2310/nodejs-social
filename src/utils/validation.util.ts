import HTTP_STATUS from '@/constants/httpStatus.constant';
import { ERROR_MESSAGE } from '@/constants/message.constant';
import { ErrorEntity, ErrorWithStatus } from '@/models/error.model';
import express from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema';

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await validation.run(req);

    const errors = validationResult(req);
    const errorMapped = errors.mapped();

    const errorEntity = new ErrorEntity({
      message: ERROR_MESSAGE.UNPROCESSABLE_ENTITY,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      errors: {}
    });

    for (const key in errorMapped) {
      const { msg } = errorMapped[key];

      // If error is not a validation error, throw it
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg);
      }

      // Map error to ErrorEntity
      errorEntity.errors[key] = errorMapped[key];
    }

    if (!errors.isEmpty()) {
      return next(new ErrorEntity(errorEntity));
    }

    // If no errors, continue
    next();
  };
};
