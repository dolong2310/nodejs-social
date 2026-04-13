import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { RedisService } from '@/infrastructure/persistence/redis/redis.service';

import Container from '@/bootstrap/container';

export function setupContainer(database: DatabaseService, redis: RedisService) {
  const container = Container.getOrSet(database, redis);

  return container;
}
