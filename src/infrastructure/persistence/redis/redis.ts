import logger from '@/infrastructure/logger/create-logger';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import RedisClient, { type RedisOptions } from 'ioredis';
import { randomUUID } from 'node:crypto';

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
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  async ping(): Promise<void> {
    await this.client.ping();
  }

  async sendRawCommand(...args: string[]): Promise<unknown> {
    if (args.length === 0) {
      throw new Error('Redis command missing');
    }
    const [command, ...rest] = args;
    return this.client.call(command, ...rest);
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

  async set<T>(key: string, value: T, options?: { ttlSeconds?: number }): Promise<void> {
    const raw = JSON.stringify(value);
    if (options?.ttlSeconds) {
      await this.client.set(key, raw, 'EX', options.ttlSeconds);
    } else {
      await this.client.set(key, raw);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async clear(): Promise<void> {
    await this.client.flushall();
  }

  async acquireLock(key: string, ttlMs: number): Promise<{ token: string } | null> {
    const token = randomUUID();

    const result = await this.client.set(key, token, 'PX', ttlMs, 'NX');

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

    await this.client.eval(script, 1, key, token);
  }
}
