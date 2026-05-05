export interface CacheManagerPort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(...keys: string[]): Promise<void>;
  clear(): Promise<void>;
  getOrSet<T>(key: string, fn: () => Promise<T>, ttlSeconds: number): Promise<T>;
}
