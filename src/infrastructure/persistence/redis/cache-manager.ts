import type { RedisClientPort } from '@/infrastructure/persistence/redis/redis-client';
import type {
  CacheManagerPort,
  ReadThroughOptions,
  WriteThroughOptions
} from '@/modules/core/application/ports/cache-manager.port';
import { randomUUID } from 'node:crypto';

type CacheValue<T> =
  | {
      type: 'hit';
      value: T;
    }
  | {
      type: 'null';
    };

export class CacheManager implements CacheManagerPort {
  constructor(private readonly redis: RedisClientPort) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.client.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  }

  async set<T>(key: string, value: T, options?: { ttlSeconds?: number }): Promise<void> {
    const raw = JSON.stringify(value);
    if (options?.ttlSeconds) {
      await this.redis.client.set(key, raw, 'EX', options.ttlSeconds);
    } else {
      await this.redis.client.set(key, raw);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.redis.client.del(...keys);
    }
  }

  async clear(): Promise<void> {
    await this.redis.client.flushall();
  }

  async acquireLock(key: string, ttlMs: number): Promise<{ token: string } | null> {
    const token = randomUUID();

    const result = await this.redis.client.set(key, token, 'PX', ttlMs, 'NX');

    if (result !== 'OK') return null;

    return { token };
  }

  async releaseLock(key: string, token: string): Promise<void> {
    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;

    await this.redis.client.eval(script, 1, key, token);
  }

  // Advanced methods

  async read<T>(key: string, loader: () => Promise<T | null>, options: ReadThroughOptions): Promise<T | null> {
    const cached = await this.get<CacheValue<T>>(key);

    if (cached) {
      if (cached.type === 'hit') return cached.value;
      if (cached.type === 'null') return null;
    }

    const lockKey = `lock:${key}`;
    const lock = await this.acquireLock(lockKey, options.lockTtlMs ?? 5000);

    if (!lock) {
      return this.waitAndRetry(key, loader, options);
    }

    try {
      const cachedAgain = await this.get<CacheValue<T>>(key);

      if (cachedAgain) {
        if (cachedAgain.type === 'hit') return cachedAgain.value;
        if (cachedAgain.type === 'null') return null;
      }

      const data = await loader();

      if (data === null) {
        await this.set<CacheValue<T>>(
          key,
          { type: 'null' },
          {
            ttlSeconds: options.negativeTtlSeconds ?? 30
          }
        );

        return null;
      }

      await this.set<CacheValue<T>>(
        key,
        {
          type: 'hit',
          value: data
        },
        {
          ttlSeconds: this.withJitter(options.ttlSeconds, options.jitterRatio ?? 0.1)
        }
      );

      return data;
    } finally {
      await this.releaseLock(lockKey, lock.token);
    }
  }

  async write<T>(key: string, writer: () => Promise<T>, options: WriteThroughOptions): Promise<T> {
    const data = await writer();

    try {
      await this.set(
        key,
        {
          type: 'hit',
          value: data
        },
        {
          ttlSeconds: this.withJitter(options.ttlSeconds, options.jitterRatio ?? 0.1)
        }
      );
    } catch {
      if (options.rollbackCacheOnError) {
        await this.del(key);
      }

      // The DB write succeeded but Redis failed.
      // Do not roll back the DB only because the cache failed.
      // This can be logged or retried through a follow-up job later.
    }

    return data;
  }

  async delete(key: string, deleter: () => Promise<void>): Promise<void> {
    await deleter();
    await this.del(key);
  }

  async invalidate(key: string): Promise<void> {
    await this.del(key);
  }

  private async waitAndRetry<T>(
    key: string,
    loader: () => Promise<T | null>,
    options: ReadThroughOptions
  ): Promise<T | null> {
    const waitMs = options.waitMs ?? 100;
    const maxAttempts = options.maxWaitAttempts ?? 20;

    for (let i = 0; i < maxAttempts; i++) {
      await sleep(waitMs);

      const cached = await this.get<CacheValue<T>>(key);

      if (cached) {
        if (cached.type === 'hit') return cached.value;
        if (cached.type === 'null') return null;
      }
    }

    // Important:
    // Do not call the DB directly here.
    // Compete for the lock again so each key has only one loader running.
    return this.read(key, loader, options);
  }

  // Add a small random amount to the TTL so keys do not expire at the same time.
  // For example, instead of 10,000 keys expiring exactly at second 300, spread them across 300-330 seconds.
  // This reduces Redis/DB spikes caused by mass expiration.
  private withJitter(ttlSeconds: number, ratio: number): number {
    const jitter = Math.floor(ttlSeconds * ratio * Math.random());
    return ttlSeconds + jitter;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
