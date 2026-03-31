import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { BadRequestError } from '@/providers';
import { validate } from '@/utils';
import { NextFunction, Request, Response } from 'express';
import { checkSchema } from 'express-validator';
import { pick } from 'lodash-es';

/**
 * @deprecated: use DTO instead
 */
export const filterBodyMiddleware =
  <T>(filterKeys: (keyof T)[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys as string[]);
    next();
  };

export const validatePaginationQuery = validate(
  checkSchema(
    {
      page: {
        isNumeric: true,
        custom: {
          options: async (value: string) => {
            const page = Number(value);

            if (page < 1) {
              throw new BadRequestError(VALIDATION_ERROR_MESSAGE.PAGE_MUST_BE_GREATER_THAN_0);
            }

            return true;
          }
        }
      },
      limit: {
        isNumeric: true,
        custom: {
          options: async (value: string) => {
            const limit = Number(value);

            if (limit < 1 || limit > 100) {
              throw new BadRequestError(VALIDATION_ERROR_MESSAGE.LIMIT_MUST_BE_BETWEEN_1_TO_100);
            }

            return true;
          }
        }
      }
    },
    ['query']
  )
);

export const validateCursorPaginationQuery = validate(
  checkSchema(
    {
      limit: {
        isNumeric: true,
        custom: {
          options: async (value: string) => {
            const limit = Number(value);
            if (limit < 1 || limit > 100) {
              throw new BadRequestError(VALIDATION_ERROR_MESSAGE.LIMIT_MUST_BE_BETWEEN_1_TO_100);
            }
            return true;
          }
        }
      },
      cursor: {
        optional: true,
        isString: true
      }
    },
    ['query']
  )
);
