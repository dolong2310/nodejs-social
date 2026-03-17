import { HTTP_STATUS } from '@/constants/httpStatus.constant';
import { HTTP_ERROR_MESSAGE } from '@/constants/message.constant';
import { UnprocessableEntityError } from '@/models/error.response';
import express from 'express';
import { ValidationChain, ValidationError, validationResult } from 'express-validator';
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema';

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await validation.run(req);

    const errors = validationResult(req);
    const errorMapped = errors.mapped();

    const errorObject: { message: string; status: number; errors: Record<string, ValidationError> } = {
      message: HTTP_ERROR_MESSAGE.UNPROCESSABLE_ENTITY,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      errors: {}
    };

    for (const key in errorMapped) {
      const error: ValidationError = errorMapped[key];
      errorObject.errors[key] = error;
    }

    if (!errors.isEmpty()) {
      return next(new UnprocessableEntityError(errorObject.message, errorObject.status, errorObject.errors));
    }

    // If no errors, continue
    next();
  };
};
