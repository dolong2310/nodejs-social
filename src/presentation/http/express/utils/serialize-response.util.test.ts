import { EnumUserStatus } from '@/modules/user/domain/entities/user.types';
import { OK } from '@/presentation/http/express/responses/success.response';
import {
  ResponseSerializationException,
  serializeResponse
} from '@/presentation/http/express/utils/serialize-response.util';
import { UserResponseSchema } from '@/presentation/http/express/v1/schemas/user/user.response.schema';
import { describe, expect, it } from 'vitest';

const now = new Date('2026-01-01T00:00:00.000Z');
const user = {
  id: 'user-1',
  name: 'Long',
  email: 'long@example.com',
  birthday: now,
  roleId: 'role-1',
  status: EnumUserStatus.ACTIVE,
  createdAt: now,
  updatedAt: now
};

describe('serializeResponse', () => {
  it('strips undeclared (sensitive) fields from SuccessResponse data', async () => {
    const result = new OK({ data: { ...user, password: 'hash', totpSecret: 'secret' } });

    const serialized = await serializeResponse(result, UserResponseSchema);

    expect(serialized).toBe(result);
    expect(result.data).toEqual(user);
  });

  it('accepts dates that were JSON round-tripped by the Redis cache', async () => {
    const cached = JSON.parse(JSON.stringify(user));
    const result = new OK({ data: cached });

    await serializeResponse(result, UserResponseSchema);

    expect(result.data).toEqual(user);
  });

  it('parses a raw controller result', async () => {
    expect(await serializeResponse({ ...user, password: 'hash' }, UserResponseSchema)).toEqual(user);
  });

  it('returns the result untouched when the route has no response schema', async () => {
    const result = new OK({ data: { password: 'hash' } });

    expect(await serializeResponse(result)).toBe(result);
  });

  it('throws a 500 carrying the issues instead of leaking data that does not match the schema', async () => {
    const result = new OK({ data: { ...user, email: undefined } });

    const error = await serializeResponse(result, UserResponseSchema).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ResponseSerializationException);
    expect(error).toMatchObject({ statusCode: 500, errors: {}, issues: { nested: { email: expect.any(Array) } } });
  });
});
