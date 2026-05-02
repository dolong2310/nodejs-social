import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import logger from '@/infrastructure/logger/create-logger';
import RedisClient, { type RedisOptions } from 'ioredis';

const log = logger.child({ module: 'redis' });

export class Redis implements CacheManagerPort {
  private readonly client: RedisClient;

  constructor(options: RedisOptions) {
    this.client = new RedisClient({
      ...options,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      keepAlive: 30000
    });

    this.client.on('error', (err: Error) => {
      log.error({ err }, 'redis client error');
    });

    this.client.on('connect', () => {
      log.info('connected to redis');
    });

    this.client.on('reconnecting', () => {
      log.warn('redis reconnecting');
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      await this.client.ping();
    } catch (error) {
      log.error({ err: error }, 'error connecting to redis');
      this.client.disconnect();
      throw error;
    }
    log.info('connected to redis');
  }

  async disconnect(): Promise<void> {
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
      return raw as T;
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
