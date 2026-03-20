import RedisService from '@/database/redis/redis.service';
import { logger } from '@/logger';
import Redis, { type RedisOptions } from 'ioredis';

const log = logger.child({ module: 'redis' });

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
      log.error({ err }, 'redis client error');
    });

    client.on('connect', () => {
      log.info('connected to redis');
    });

    client.on('reconnecting', () => {
      log.warn('redis reconnecting');
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
