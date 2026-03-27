import { Query } from 'express-serve-static-core';

export interface PaginationQueryDTO extends Query {
  page: string;
  limit: string;
}
