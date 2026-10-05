import { ExceptionBase, type ExceptionType } from '@/modules/core/domain/exceptions/exception.base';
import { PostNotFoundException } from '@/modules/post/application/exceptions/post.exception';
import { HttpExceptionFilter } from '@/presentation/http/express/filters/exception.filter';
import { EXCEPTION_TYPE_HTTP_STATUS } from '@/presentation/http/express/utils/exception-http-status.util';
import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

function respond(error: Error) {
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  HttpExceptionFilter.catch(
    error,
    { log: undefined } as unknown as Request,
    response as unknown as Response,
    (() => undefined) as NextFunction
  );
  return response;
}

describe('HttpExceptionFilter', () => {
  it.each<[ExceptionType, number]>([
    ['invalid_argument', 400],
    ['unauthenticated', 401],
    ['forbidden', 403],
    ['not_found', 404],
    ['conflict', 409],
    ['too_large', 413],
    ['range_not_satisfiable', 416],
    ['rate_limited', 429],
    ['internal', 500],
    ['unavailable', 503]
  ])('maps a %s exception to HTTP %i', (type, status) => {
    class TestException extends ExceptionBase {
      readonly code = 'TEST.EXCEPTION';
      readonly type = type;
    }

    expect(EXCEPTION_TYPE_HTTP_STATUS[type]).toBe(status);
    expect(respond(new TestException('failed')).status).toHaveBeenCalledWith(status);
  });

  it('responds with the exception message, or its code when there is none', () => {
    const response = respond(new PostNotFoundException());

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith({ message: 'POST.NOT_FOUND', errors: {} });
  });
});
