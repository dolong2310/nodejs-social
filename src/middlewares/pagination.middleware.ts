/*
 * Middleware for handling pagination in API responses.
 * This middleware extracts pagination parameters from the request and provides a method to fetch paginated results from a MongoDB model.
 */

import { NextFunction, Request, Response } from 'express';
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    pagination?: {
      page: number;
      limit: number;
      skip: number;
      getPaginationResult<T>(model: any, query: any): Promise<PaginationResult<T>>;
    };
  }
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
}

// Middleware to handle pagination
// Extracts page and limit from query parameters
// Adds a method to the request object to fetch paginated results from a MongoDB model
export const paginateResults = (req: Request, _res: Response, next: NextFunction): void => {
  const page = Number(req.query.page as string) || 1;
  const limit = Number(req.query.limit as string) || 10;

  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
    async getPaginationResult<T>(model: any, query: any): Promise<PaginationResult<T>> {
      const totalItems = await model.count({
        where: query.where
      });

      const totalPages = Math.ceil(totalItems / limit);

      const results = await model.findMany({
        ...query,
        skip: (page - 1) * limit,
        take: limit
      });

      return {
        data: results,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null
        }
      };
    }
  };

  next();
};
