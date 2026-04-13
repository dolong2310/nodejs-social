import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { RedisService } from '@/infrastructure/persistence/redis/redis.service';

export function createShutdownResources(database: DatabaseService, redis: RedisService) {
  return [
    {
      close: () => database.disconnect()
    },
    {
      close: () => redis.disconnect()
    }
  ];
}
