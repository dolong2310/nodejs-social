import Container from '@/bootstrap/container';
import { Database } from '@/infrastructure/persistence/mongodb/database';
import { Redis } from '@/infrastructure/persistence/redis/redis';
import { type Server as SocketIOServer } from 'socket.io';

export function setupContainer(database: Database, redis: Redis, io: SocketIOServer) {
  const container = Container.getOrSet(database, redis, io);
  return container;
}
