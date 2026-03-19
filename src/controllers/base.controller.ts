/*
 * This file contains the BaseController class which provides common methods for handling requests and responses.
 * It includes methods for validation error handling, error handling, sending responses, pagination, user ID retrieval, and cookie management.
 */

import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { AuthFailureError, NotFoundError } from '@/responses/error.response';
import { NextFunction, Request, Response } from 'express';

export abstract class BaseController {
  /**
   * Handles errors by passing them to the next middleware.
   */
  protected handleError(error: unknown, next: NextFunction): void {
    next(error);
  }

  /**
   * Sends a response with the specified status code, message, and data.
   */
  protected sendResponse(res: Response, statusCode: number, message: string, data?: any): void {
    res.status(statusCode).json({
      statusCode,
      message,
      data
    });
  }

  /**
   * Sends a paginated response with the specified status code, message, data, and pagination details.
   */
  protected sendPaginatedResponse(
    res: Response,
    statusCode: number,
    message: string,
    data: any,
    pagination: {
      currentPage?: number;
      totalPages?: number;
      totalItems?: number;
      itemsPerPage?: number;
      hasNext?: boolean;
      hasPrev?: boolean;
    }
  ): void {
    res.status(statusCode).json({
      statusCode,
      message,
      data,
      pagination
    });
  }

  /**
   * Retrieves the user ID from the request object.
   */
  protected getUserId(req: Request): string {
    const userId = req.tokenPayload?.userId;
    if (!userId) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }
    return userId;
  }

  /**
   * Sets a cookie with the specified name, value, and options.
   */
  protected setCookie(res: Response, name: string, value: string, maxAge: number): void {
    res.cookie(name, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge
    });
  }

  /**
   * Clears a cookie with the specified name.
   */
  protected clearCookie(res: Response, name: string): void {
    res.clearCookie(name);
  }
}
