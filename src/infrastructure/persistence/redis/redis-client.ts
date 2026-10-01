import logger from '@/infrastructure/logger/create-logger';

import Client, { type RedisOptions } from 'ioredis';

const log = logger.child({ module: 'redis' });

export interface RedisClientPort {
  client: Client;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export class Redis implements RedisClientPort {
  private readonly _client: Client;

  constructor(options: RedisOptions) {
    this._client = new Client({
      ...options,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      keepAlive: 30000
    });

    this._client.on('error', (err: Error) => {
      log.error({ err }, 'redis:::client-error');
    });

    this._client.on('connect', () => {
      log.info('redis:::connected');
    });

    this._client.on('reconnecting', () => {
      log.warn('redis:::reconnecting');
    });
  }

  get client(): Client {
    return this._client;
  }

  async connect(): Promise<void> {
    try {
      await this._client.connect();
      await this._client.ping();
    } catch (error) {
      log.error({ err: error }, 'redis:::error-connecting');
      this._client.disconnect();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this._client.quit();
  }
}
