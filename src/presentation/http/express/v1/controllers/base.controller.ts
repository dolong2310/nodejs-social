import { isProduction } from '@/bootstrap/config/env.config';
import { UserNotFoundException } from '@/presentation/http/express/exceptions/user.exception';
import {
  Created,
  OK,
  SuccessResponse,
  SuccessResponseParams
} from '@/presentation/http/express/responses/success.response';
import { PaginationResponseDTO } from '@/presentation/http/express/v1/dtos/common/common.response.dto';
import type { CookieOptions } from 'express';
import { Request, Response } from 'express';

export abstract class BaseController {
  protected response<T>({
    instance = OK,
    data,
    message,
    statusCode,
    reasonPhrasesCode
  }: SuccessResponseParams<T> & { instance?: typeof OK | typeof Created }): SuccessResponse<T> {
    return new instance<T>({
      data,
      message,
      statusCode,
      reasonPhrasesCode
    });
  }

  protected paginatedResponse<T, P = PaginationResponseDTO & { data: T }>({
    data,
    pagination,
    message
  }: {
    data: T;
    pagination: {
      page: string | number;
      limit: string | number;
      totalItems: string | number;
    };
    message: string;
  }): SuccessResponse<P> {
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

    return this.response<P>({
      data: payload,
      message
    });
  }

  protected cursorPaginatedResponse<TItem>({
    items,
    nextCursor,
    message
  }: {
    items: TItem[];
    nextCursor: string | null;
    message: string;
  }): SuccessResponse<{ items: TItem[]; nextCursor: string | null }> {
    return this.response({
      data: { items, nextCursor },
      message
    });
  }

  protected fileResponse<T extends string>(res: Response, path: T): void {
    res.sendFile(path);
  }

  protected getUserId(req: Request, options?: { optional?: boolean }): string {
    const userId = req.tokenPayload?.userId;
    if (!userId && !options?.optional) {
      throw UserNotFoundException;
    }
    return userId || '';
  }

  protected setCookie(res: Response, name: string, value: string, options?: CookieOptions): void {
    const defaults: CookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict'
    };
    res.cookie(name, value, { ...defaults, ...options });
  }

  protected clearCookie(res: Response, name: string, options?: CookieOptions): void {
    res.clearCookie(name, options ?? {});
  }

  // Filter undefined fields
  protected sanitize<T extends object>(obj: T): T {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
  }
}
