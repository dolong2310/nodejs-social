import {
  LimitMustBeBetweenOneToHundredException,
  PageMustBeGreaterThanZeroException
} from '@/application/errors/pagination.error';

import { validate } from '@/presentation/http/utils/validation.util';

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
              throw PageMustBeGreaterThanZeroException;
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
              throw LimitMustBeBetweenOneToHundredException;
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
              throw LimitMustBeBetweenOneToHundredException;
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
