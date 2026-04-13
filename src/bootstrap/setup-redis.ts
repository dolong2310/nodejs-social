import { dbConfig } from '@/infrastructure/persistence/configurations/database.config';
import { RedisInstance } from '@/infrastructure/persistence/redis/redis.instance';

export async function setupRedis() {
  const redis = RedisInstance.init(dbConfig.redis);

  await redis.connect();

  return redis;
}
