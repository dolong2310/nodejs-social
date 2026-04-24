export interface RedisPort {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  ping(): Promise<void>;

  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(...keys: string[]): Promise<void>;
  getOrSet<T>(key: string, fn: () => Promise<T>, ttlSeconds: number): Promise<T>;

  sendRawCommand(...args: string[]): Promise<unknown>;
}
