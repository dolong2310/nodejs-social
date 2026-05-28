import IORedis, { type RedisOptions } from 'ioredis';

export function buildBullMQConnection(redisOptions: RedisOptions): IORedis {
  return new IORedis({
    host: redisOptions.host,
    port: redisOptions.port,
    username: redisOptions.username,
    password: redisOptions.password,
    db: redisOptions.db,

    maxRetriesPerRequest: null,
    enableReadyCheck: false,

    retryStrategy: (times: number) => Math.min(times * 200, 5000)
  });
}
