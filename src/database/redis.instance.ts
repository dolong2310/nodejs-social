import RedisService from '@/database/redis.service';
import Redis, { type RedisOptions } from 'ioredis';

export class RedisInstance {
  private static instance: RedisService | null = null;

  static init(options: RedisOptions): RedisService {
    if (this.instance) return this.instance;

    const client = new Redis({
      ...options,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      keepAlive: 30000
    });

    client.on('error', (err: Error) => {
      console.error('\x1b[31m%s\x1b[0m', `[Redis] ${err.message}`);
    });

    client.on('connect', () => {
      console.log('\x1b[32m%s\x1b[0m', 'Successfully connected to Redis');
    });

    client.on('reconnecting', () => {
      console.warn('\x1b[33m%s\x1b[0m', '[Redis] Reconnecting...');
    });

    this.instance = new RedisService(client);
    return this.instance;
  }

  static get(): RedisService {
    if (!this.instance) {
      throw new Error('RedisService has not been initialized. Call RedisInstance.init() during bootstrap.');
    }
    return this.instance;
  }

  static resetInstance(): void {
    this.instance = null;
  }
}
