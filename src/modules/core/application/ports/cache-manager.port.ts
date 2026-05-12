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
}
