import { IRedisService } from '@/application/ports/redis.port';

import { ConnectionService } from '@/infrastructure/persistence/connection.abstract';

import type Redis from 'ioredis';

export class RedisService extends ConnectionService implements IRedisService {
  constructor(private readonly client: Redis) {
    super();
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  protected async releaseConnection(): Promise<void> {
    await this.client.quit();
  }

  async ping(): Promise<void> {
    await this.client.ping();
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async getOrSet<T>(key: string, fn: () => Promise<T>, ttlSeconds: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await fn();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  async sendRawCommand(...args: string[]): Promise<unknown> {
    if (args.length === 0) {
      throw new Error('Redis command missing');
    }
    const [command, ...rest] = args;
    return this.client.call(command, ...rest);
  }
}
