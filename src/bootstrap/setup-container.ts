import Container from '@/bootstrap/container';
import { Database } from '@/infrastructure/persistence/mongodb/database';
import { Redis } from '@/infrastructure/persistence/redis/redis';

export function setupContainer(database: Database, redis: Redis) {
  const container = Container.getOrSet(database, redis);
  return container;
}
