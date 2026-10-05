export type ReadThroughOptions = {
  /**
   * TTL for cache hits, in seconds. When the loader returns real data, it is cached for this duration.
   */
  ttlSeconds: number;
  /**
   * TTL for cached null values. Used to prevent cache penetration. For example, cache { type: 'null' } for a missing user for 30 seconds so later requests do not hit the DB again.
   */
  negativeTtlSeconds?: number;
  /**
   * TTL for the anti-stampede lock, in milliseconds. The first request that misses cache holds the lock and calls the DB. The lock must be long enough for the loader to finish.
   */
  lockTtlMs?: number;
  /**
   * Time each request waits before reading cache again when it cannot acquire the lock.
   */
  waitMs?: number;
  /**
   * Number of cache-read retries when the lock cannot be acquired. If exhausted, it calls get() again to compete for the lock.
   */
  maxWaitAttempts?: number;
  /**
   * Random ratio added to TTL so many keys do not expire at the same time. For example, ttlSeconds = 300 and jitterRatio = 0.1 gives an effective TTL around 300-330 seconds.
   */
  jitterRatio?: number;
};

export type WriteThroughOptions = {
  ttlSeconds: number;
  jitterRatio?: number;
  /**
   * If the DB write succeeded but setting cache failed, this option allows deleting the cache key to avoid keeping stale data.
   * Note: it does not roll back the DB. The DB is the source of truth; cache failures only affect cache handling.
   */
  rollbackCacheOnError?: boolean;
};

export interface CacheManagerPort {
  get<T>(key: string): Promise<T | null>;
  set<T>(
    key: string,
    value: T,
    options?: {
      ttlSeconds?: number;
    }
  ): Promise<void>;
  del(...keys: string[]): Promise<void>;
  clear(): Promise<void>;

  acquireLock(key: string, ttlMs: number): Promise<{ token: string } | null>;
  releaseLock(key: string, token: string): Promise<void>;

  read<T>(key: string, loader: () => Promise<T | null>, options: ReadThroughOptions): Promise<T | null>;
  write<T>(key: string, writer: () => Promise<T>, options: WriteThroughOptions): Promise<T>;
  delete(key: string, deleter: () => Promise<void>): Promise<void>;
  invalidate(key: string): Promise<void>;
}
