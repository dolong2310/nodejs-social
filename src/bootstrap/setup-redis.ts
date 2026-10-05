import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { Redis, type RedisClientPort } from '@/infrastructure/persistence/redis/redis-client';

export async function setupRedis(): Promise<RedisClientPort> {
  const redis = new Redis(dbConfig.redis);
  await redis.connect();
  return redis;
}
