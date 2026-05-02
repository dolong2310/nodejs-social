import { Query } from 'express-serve-static-core';

export interface PaginationQueryDTO extends Query {
  page: string;
  limit: string;
}

export interface CursorPaginationQueryDTO extends Query {
  limit: string;
  cursor?: string;
}
