import { CacheManager } from '@/infrastructure/persistence/redis/cache-manager';
import type { RedisClientPort } from '@/infrastructure/persistence/redis/redis-client';
import { describe, expect, it } from 'vitest';

function createCacheManager() {
  const store = new Map<string, string>();
  const redis = {
    client: {
      get: async (key: string) => store.get(key) ?? null,
      set: async (key: string, value: string) => {
        store.set(key, value);
        return 'OK';
      },
      eval: async () => 1
    }
  } as unknown as RedisClientPort;

  return { cache: new CacheManager(redis), store };
}

describe('CacheManager date round-trip', () => {
  const createdAt = new Date('2026-01-01T00:00:00.000Z');

  it('restores Date instances, including nested objects and arrays', async () => {
    const { cache } = createCacheManager();
    const value = {
      id: 'user-1',
      createdAt,
      bio: '2026-01-01T00:00:00.000Z', // a real string that only looks like a date stays a string
      members: [{ joinedAt: createdAt, lastReadAt: null }],
      sourcePost: { updatedAt: createdAt, sourcePost: null }
    };

    await cache.set('key', value);
    const cached = await cache.get<typeof value>('key');

    expect(cached).toEqual(value);
    expect(cached?.createdAt).toBeInstanceOf(Date);
    expect(cached?.members[0]?.joinedAt).toBeInstanceOf(Date);
    expect(cached?.sourcePost.updatedAt).toBeInstanceOf(Date);
    expect(typeof cached?.bio).toBe('string');
  });

  it('restores dates through read-through caching (cache hit path)', async () => {
    const { cache } = createCacheManager();
    const loader = async () => ({ id: 'user-1', birthday: createdAt });

    await cache.read('user:1', loader, { ttlSeconds: 60 });
    const hit = await cache.read<{ id: string; birthday: Date }>('user:1', async () => null, { ttlSeconds: 60 });

    expect(hit?.birthday).toBeInstanceOf(Date);
    expect(hit?.birthday.getTime()).toBe(createdAt.getTime());
  });

  it('stores an invalid date as null instead of throwing', async () => {
    const { cache } = createCacheManager();

    await cache.set('key', { at: new Date('invalid') });

    expect(await cache.get('key')).toEqual({ at: null });
  });

  it('keeps objects with a custom toJSON in their JSON form', async () => {
    const { cache } = createCacheManager();
    const id = { value: 'abc', toJSON: () => 'abc' };

    await cache.set('key', { id });

    expect(await cache.get('key')).toEqual({ id: 'abc' });
  });
});
