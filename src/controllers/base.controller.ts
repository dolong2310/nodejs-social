/*
 * This file contains the BaseController class which provides common methods for handling requests and responses.
 * It includes methods for validation error handling, error handling, sending responses, pagination, user ID retrieval, and cookie management.
 */

import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { IPaginationResponse } from '@/models/responses/common.response';
import { NotFoundError } from '@/responses/error.response';
import { Created, OK, SuccessResponseParams } from '@/responses/success.response';
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
  protected sendResponse<T>({
    res,
    instance = OK,
    data,
    message,
    statusCode,
    reasonPhrasesCode
  }: SuccessResponseParams<T> & { res: Response; instance?: typeof OK | typeof Created }): void {
    new instance<T>({
      data,
      message,
      statusCode,
      reasonPhrasesCode
    }).send(res);
  }

  /**
   * Sends a paginated response with the specified status code, message, data, and pagination details.
   */
  protected sendPaginatedResponse<T, P = IPaginationResponse & { data: T }>({
    res,
    data,
    pagination,
    message
  }: {
    res: Response;
    data: T;
    pagination: {
      page: string | number;
      limit: string | number;
      totalItems: string | number;
    };
    message: string;
  }): void {
    const page = Number(pagination.page);
    const limit = Number(pagination.limit);
    const totalItems = Number(pagination.totalItems);
    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page ? page < totalPages! : false;
    const hasPrev = page ? page > 1 : false;

    const payload = {
      data,
      page,
      limit,
      totalItems,
      totalPages,
      hasNext,
      hasPrev
    } as P;

    new OK<P>({
      data: payload,
      message
    }).send(res);
  }

  sendFileResponse<T extends string>(res: Response, path: T): void {
    res.sendFile(path);
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
