import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { validate } from '@/presentation/http/express/pipes/validation.pipe';
import { UnprocessableEntityException } from '@/presentation/http/express/responses/error.response';
import type { ExpressRequest } from '@/presentation/http/express/types';
import {
  ChangePasswordBodySchema,
  GetUserProfileParamsSchema,
  UpdateMeBodySchema
} from '@/presentation/http/express/v1/schemas/user/user.request.schema';
import { PaginationQuerySchema } from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import { describe, expect, it } from 'vitest';

function makeRequest(parts: { body?: unknown; params?: unknown; query?: unknown; headers?: unknown }): ExpressRequest {
  const req = { body: parts.body, params: parts.params ?? {}, headers: parts.headers ?? {} } as ExpressRequest;
  // Mimic Express 5: `query` is a getter on the request prototype.
  const proto = { get query() { return parts.query ?? {}; } };
  Object.setPrototypeOf(req, proto);
  return req;
}

async function catchError(promise: Promise<unknown>): Promise<UnprocessableEntityException> {
  try {
    await promise;
  } catch (error) {
    return error as UnprocessableEntityException;
  }
  throw new Error('Expected the pipe to throw');
}

describe('ValidationPipe', () => {
  it('replaces body with the parsed output (trim, Date, normalized username)', async () => {
    const req = makeRequest({ body: { name: '  Long  ', birthday: '2000-01-01', username: '  Long_Do ' } });

    await validate({ body: UpdateMeBodySchema }).transform(req);

    expect(req.body).toEqual({ name: 'Long', birthday: new Date('2000-01-01'), username: 'long_do' });
  });

  it('accepts a missing body when every field is optional', async () => {
    const req = makeRequest({ body: undefined });

    await validate({ body: UpdateMeBodySchema }).transform(req);

    expect(req.body).toEqual({});
  });

  it('rejects unknown, missing and invalid fields with the field error shape', async () => {
    const req = makeRequest({ body: { password: 'Abc@123', role: 'ADMIN' } });

    const error = await catchError(validate({ body: ChangePasswordBodySchema }).transform(req));

    expect(error).toBeInstanceOf(UnprocessableEntityException);
    expect(error.statusCode).toBe(422);
    expect(error.errors).toEqual({
      role: {
        type: 'field',
        value: 'ADMIN',
        msg: VALIDATION_ERROR_MESSAGE.FIELD_IS_NOT_ALLOWED,
        path: 'role',
        location: 'body'
      },
      confirmPassword: {
        type: 'field',
        value: undefined,
        msg: VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_IS_REQUIRED,
        path: 'confirmPassword',
        location: 'body'
      }
    });
  });

  it('reports only the first issue per field', async () => {
    const req = makeRequest({ body: { birthday: 'not-a-date', bio: 123 } });

    const error = await catchError(validate({ body: UpdateMeBodySchema }).transform(req));

    expect(Object.keys(error.errors)).toEqual(['birthday', 'bio']);
    expect(error.errors.birthday).toMatchObject({ msg: VALIDATION_ERROR_MESSAGE.DATE_OF_BIRTH_MUST_BE_ISO8601 });
    expect(error.errors.bio).toMatchObject({ msg: VALIDATION_ERROR_MESSAGE.BIO_MUST_BE_A_STRING });
  });

  it('runs cross-field checks once both fields are valid', async () => {
    const req = makeRequest({ body: { password: 'Abc@123', confirmPassword: 'Abc@124' } });

    const error = await catchError(validate({ body: ChangePasswordBodySchema }).transform(req));

    expect(error.errors).toEqual({
      confirmPassword: expect.objectContaining({ msg: VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_MUST_MATCH_PASSWORD })
    });
  });

  it('validates params', async () => {
    const req = makeRequest({ params: { username: '1' } });

    const error = await catchError(validate({ params: GetUserProfileParamsSchema }).transform(req));

    expect(error.errors.username).toMatchObject({ location: 'params' });
  });

  it('coerces query values, strips unknown query keys and overrides the Express 5 query getter', async () => {
    const req = makeRequest({ query: { page: '2', limit: '10', utm_source: 'x' } });

    await validate({ query: PaginationQuerySchema }).transform(req);

    expect(req.query).toEqual({ page: 2, limit: 10 });
  });

  it('rejects out-of-range pagination', async () => {
    const req = makeRequest({ query: { page: '0', limit: 'abc' } });

    const error = await catchError(validate({ query: PaginationQuerySchema }).transform(req));

    expect(error.errors).toEqual({
      page: expect.objectContaining({ msg: VALIDATION_ERROR_MESSAGE.PAGE_MUST_BE_GREATER_THAN_0, location: 'query' }),
      limit: expect.objectContaining({ msg: VALIDATION_ERROR_MESSAGE.LIMIT_MUST_BE_BETWEEN_1_TO_100, location: 'query' })
    });
  });
});
