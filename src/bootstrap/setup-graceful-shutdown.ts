import type { DatabasePort } from '@/infrastructure/persistence/database.port';
import { Redis } from '@/infrastructure/persistence/redis/redis';
import { Server as HttpServer } from 'http';

export function setupGracefulShutdown(httpServer: HttpServer, database: DatabasePort, redis: Redis): void {
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
