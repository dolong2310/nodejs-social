import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import {
  CacheStrategyPort,
  ReadThroughOptions,
  WriteThroughOptions
} from '@/modules/core/application/ports/cache-strategy.port';

type CacheValue<T> =
  | {
      type: 'hit';
      value: T;
    }
  | {
      type: 'null';
    };

export class CacheStrategy implements CacheStrategyPort {
  constructor(private readonly cache: CacheManagerPort) {}

  async get<T>(key: string, loader: () => Promise<T | null>, options: ReadThroughOptions): Promise<T | null> {
    const cached = await this.cache.get<CacheValue<T>>(key);

    if (cached) {
      if (cached.type === 'hit') return cached.value;
      if (cached.type === 'null') return null;
    }

    const lockKey = `lock:${key}`;
    const lock = await this.cache.acquireLock(lockKey, options.lockTtlMs ?? 5000);

    if (!lock) {
      return this.waitAndRetry(key, loader, options);
    }

    try {
      const cachedAgain = await this.cache.get<CacheValue<T>>(key);

      if (cachedAgain) {
        if (cachedAgain.type === 'hit') return cachedAgain.value;
        if (cachedAgain.type === 'null') return null;
      }

      const data = await loader();

      if (data === null) {
        await this.cache.set<CacheValue<T>>(
          key,
          { type: 'null' },
          {
            ttlSeconds: options.negativeTtlSeconds ?? 30
          }
        );

        return null;
      }

      await this.cache.set<CacheValue<T>>(
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
      await this.cache.releaseLock(lockKey, lock.token);
    }
  }

  async write<T>(key: string, writer: () => Promise<T>, options: WriteThroughOptions): Promise<T> {
    const data = await writer();

    try {
      await this.cache.set(
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
        await this.cache.del(key);
      }

      // The DB write succeeded but Redis failed.
      // Do not roll back the DB only because the cache failed.
      // This can be logged or retried through a follow-up job later.
    }

    return data;
  }

  async delete(key: string, deleter: () => Promise<void>): Promise<void> {
    await deleter();
    await this.cache.del(key);
  }

  async invalidate(key: string): Promise<void> {
    await this.cache.del(key);
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

      const cached = await this.cache.get<CacheValue<T>>(key);

      if (cached) {
        if (cached.type === 'hit') return cached.value;
        if (cached.type === 'null') return null;
      }
    }

    // Important:
    // Do not call the DB directly here.
    // Compete for the lock again so each key has only one loader running.
    return this.get(key, loader, options);
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
