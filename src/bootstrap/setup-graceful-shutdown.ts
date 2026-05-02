import { Database } from '@/infrastructure/persistence/mongodb/database';
import { Redis } from '@/infrastructure/persistence/redis/redis';
import { Server as HttpServer } from 'http';

export function setupGracefulShutdown(httpServer: HttpServer, database: Database, redis: Redis): void {
  const shutdown = async (signal: string) => {
    console.log({ signal }, 'shutting down gracefully');

    httpServer.close(async () => {
      await Promise.allSettled([database.disconnect(), redis.disconnect()]);

      console.log('all connections closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
