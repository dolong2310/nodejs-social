import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { queryObject } from '@/presentation/http/express/utils/schema.util';
import {
  array,
  boolean,
  digits,
  type GenericSchema,
  maxValue,
  minValue,
  nullable,
  number,
  object,
  optional,
  pipe,
  string,
  toNumber,
  trim
} from 'valibot';

const pageSchema = pipe(
  string(VALIDATION_ERROR_MESSAGE.PAGE_MUST_BE_GREATER_THAN_0),
  trim(),
  digits(VALIDATION_ERROR_MESSAGE.PAGE_MUST_BE_GREATER_THAN_0),
  toNumber(),
  minValue(1, VALIDATION_ERROR_MESSAGE.PAGE_MUST_BE_GREATER_THAN_0)
);

const limitSchema = pipe(
  string(VALIDATION_ERROR_MESSAGE.LIMIT_MUST_BE_BETWEEN_1_TO_100),
  trim(),
  digits(VALIDATION_ERROR_MESSAGE.LIMIT_MUST_BE_BETWEEN_1_TO_100),
  toNumber(),
  minValue(1, VALIDATION_ERROR_MESSAGE.LIMIT_MUST_BE_BETWEEN_1_TO_100),
  maxValue(100, VALIDATION_ERROR_MESSAGE.LIMIT_MUST_BE_BETWEEN_1_TO_100)
);

// Request ---------------------------------------------------------------------------------

/** Spread into a route's query schema: `queryObject({ ...paginationQueryEntries, q: ... })`. */
export const paginationQueryEntries = { page: pageSchema, limit: limitSchema };
export const cursorPaginationQueryEntries = { limit: limitSchema, cursor: optional(pipe(string(), trim())) };

export const PaginationQuerySchema = queryObject(paginationQueryEntries);
export const CursorPaginationQuerySchema = queryObject(cursorPaginationQueryEntries);

// Response --------------------------------------------------------------------------------

/** Shape produced by `BaseController.paginatedResponse`. */
export const paginatedSchema = <TItem extends GenericSchema>(item: TItem) =>
  object({
    data: array(item),
    page: number(),
    limit: number(),
    totalItems: number(),
    totalPages: number(),
    hasNext: boolean(),
    hasPrev: boolean()
  });

/** Shape produced by `BaseController.cursorPaginatedResponse`. */
export const cursorPaginatedSchema = <TItem extends GenericSchema>(item: TItem) =>
  object({
    items: array(item),
    nextCursor: nullable(string())
  });
