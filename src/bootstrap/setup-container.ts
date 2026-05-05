import Container from '@/bootstrap/container';
import { DatabasePort } from '@/infrastructure/persistence/mongodb/database';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { type Server as SocketIOServer } from 'socket.io';

export function setupContainer(database: DatabasePort, redis: CacheManagerPort, io: SocketIOServer) {
  const container = Container.getOrSet(database, redis, io);
  return container;
}
