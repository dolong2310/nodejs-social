import {
  LimitMustBeBetweenOneToHundredException,
  PageMustBeGreaterThanZeroException
} from '@/presentation/http/express/exceptions/pagination.exception';
import { ExpressRequestHandler } from '@/presentation/http/express/types';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { checkSchema } from 'express-validator';

export interface IPaginationPipe {
  paginationQuery: ExpressRequestHandler;
  cursorPaginationQuery: ExpressRequestHandler;
}

export class PaginationPipe implements IPaginationPipe {
  paginationQuery = validate(
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

  cursorPaginationQuery = validate(
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
}
