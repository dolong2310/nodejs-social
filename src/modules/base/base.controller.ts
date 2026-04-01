/*
 * This file contains the BaseController class which provides common methods for handling requests and responses.
 * It includes methods for validation error handling, error handling, sending responses, pagination, user ID retrieval, and cookie management.
 */

import { isProduction } from '@/config/envConfig';
import { MissingAuthenticatedUserException } from '@/modules/base/base.exception';
import { Created, OK, SuccessResponseParams } from '@/providers/httpResponses/success.response';
import { PaginationResponseDTO } from '@/shared/dtos/common.response.dto';
import type { CookieOptions } from 'express';
import { Request, Response } from 'express';

export abstract class BaseController {
  /**
   * Filter undefined fields
   */
  sanitize<T extends object>(obj: T): T {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
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
  protected sendPaginatedResponse<T, P = PaginationResponseDTO & { data: T }>({
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
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

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

  /**
   * Sends a cursor pagination response (no skip/total), typically used by `cursor` + `limit`.
   * Output payload shape (fixed): `{ items, nextCursor }`.
   */
  protected sendCursorPaginatedResponse<TItem>({
    res,
    items,
    nextCursor,
    message
  }: {
    res: Response;
    items: TItem[];
    nextCursor: string | null;
    message: string;
  }): void {
    this.sendResponse({
      res,
      data: { items, nextCursor },
      message
    });
  }

  sendFileResponse<T extends string>(res: Response, path: T): void {
    res.sendFile(path);
  }

  /**
   * Retrieves the user ID from the request object.
   */
  protected getUserId(req: Request, options?: { optional?: boolean }): string {
    const userId = req.tokenPayload?.userId;
    if (!userId && !options?.optional) {
      throw MissingAuthenticatedUserException;
    }
    return userId || '';
  }

  /**
   * Sets a cookie. Mặc định: httpOnly, secure (prod), sameSite strict — có thể ghi đè / bổ sung qua `options` (vd. path, sameSite: lax, maxAge).
   */
  protected setCookie(res: Response, name: string, value: string, options?: CookieOptions): void {
    const defaults: CookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict'
    };
    res.cookie(name, value, { ...defaults, ...options });
  }

  /**
   * Clears a cookie. Nên truyền cùng path/sameSite/httpOnly/secure như lúc set để trình duyệt xóa đúng.
   */
  protected clearCookie(res: Response, name: string, options?: CookieOptions): void {
    res.clearCookie(name, options ?? {});
  }

  /**
   * Handles errors by passing them to the next middleware.
   */
  // protected handleError(error: unknown, next: NextFunction): void {
  //   next(error);
  // }
}
