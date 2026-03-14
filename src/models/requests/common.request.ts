import { Query } from 'express-serve-static-core';

export interface IPaginationRequestQuery extends Query {
  page: string;
  limit: string;
}
