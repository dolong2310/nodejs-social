import { type RedisReply, RedisStore } from 'rate-limit-redis';

import { envConfig } from '@/bootstrap/config/env.config';
import { RedisClientPort } from './redis-client';

export const GLOBAL_RATE_LIMIT_KEY = 'global';
const RATE_LIMIT_PREFIX = `rate-limit:${envConfig.APP_NAME}:${envConfig.NODE_ENV}`;

// Store counters in Redis instead of process memory so multiple instances and restarts keep consistent counters.
export function createRateLimitStore(redis: RedisClientPort, key: string = GLOBAL_RATE_LIMIT_KEY): RedisStore {
  return new RedisStore({
    prefix: `${RATE_LIMIT_PREFIX}:${key}:`,
    sendCommand: (...args: string[]) => {
      const [command, ...rest] = args;

      if (!command) {
        throw new Error('Redis command is missing');
      }

      return redis.client.call(command, ...rest) as Promise<RedisReply>;
    }
  });
}
