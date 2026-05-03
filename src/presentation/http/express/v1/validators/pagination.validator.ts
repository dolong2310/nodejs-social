import {
  LimitMustBeBetweenOneToHundredException,
  PageMustBeGreaterThanZeroException
} from '@/presentation/http/express/exceptions/pagination.exception';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { checkSchema } from 'express-validator';

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
