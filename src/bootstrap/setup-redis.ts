import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { Redis } from '@/infrastructure/persistence/redis/redis';

export async function setupRedis() {
  const redis = new Redis(dbConfig.redis);
  await redis.connect();

  return redis;
}
