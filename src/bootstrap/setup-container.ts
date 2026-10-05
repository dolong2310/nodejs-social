import Container from '@/bootstrap/container';
import type { DatabasePort } from '@/infrastructure/persistence/database.port';
import type { RedisClientPort } from '@/infrastructure/persistence/redis/redis-client';
import type { Server as SocketServer } from 'socket.io';

export function setupContainer(database: DatabasePort, redis: RedisClientPort, socketServer: SocketServer) {
  const container = Container.getOrSet(database, redis, socketServer);
  return container;
}
