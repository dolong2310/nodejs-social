import { HTTP_ERROR_MESSAGE } from '@/constants/httpMessage.constant';
import { HTTP_STATUS } from '@/constants/httpStatus.constant';
import { UnprocessableEntityError } from '@/providers/httpResponses/error.response';
import { NextFunction, Request, Response } from 'express';
import { Location, matchedData, ValidationChain, ValidationError, validationResult } from 'express-validator';
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema';

export type ValidateOptions = {
  assignMatchedBody?: boolean;
  locations?: Location[];
};

export const validate = (validation: RunnableValidationChains<ValidationChain>, options?: ValidateOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
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

      return next(new UnprocessableEntityError(errorObject.message, errorObject.status, errorObject.errors));
    }

    if (options?.assignMatchedBody) {
      req.body = matchedData(req, { locations: options.locations }); // matchedData: optional fields omitted from the request are excluded by default
    }

    // If no errors, let's go
    next();
  };
};
