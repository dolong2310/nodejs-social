import { UnprocessableEntityException } from '@/presentation/http/express/responses/error.response';
import { HTTP_ERROR_MESSAGE } from '@/presentation/http/express/responses/http-message.constants';
import { HTTP_STATUS } from '@/presentation/http/express/responses/http-status.constants';
import type { NextFunction, Request, Response } from 'express';
import {
  type Location,
  matchedData,
  type ValidationChain,
  type ValidationError,
  validationResult
} from 'express-validator';
import type { RunnableValidationChains } from 'express-validator/lib/middlewares/schema';

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
        const error = errorMapped[key] as ValidationError;
        errorObject.errors[key] = error;
      }

      return next(new UnprocessableEntityException(errorObject.message, errorObject.status, errorObject.errors));
    }

    if (options?.assignMatchedBody) {
      req.body = matchedData(req, { locations: options.locations }); // matchedData: optional fields omitted from the request are excluded by default
    }

    // If no errors, let's go
    next();
  };
};
