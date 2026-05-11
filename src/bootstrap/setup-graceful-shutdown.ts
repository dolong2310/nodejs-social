import type { DatabasePort } from '@/infrastructure/persistence/database.port';
import { Redis } from '@/infrastructure/persistence/redis/redis';
import { Server as HttpServer } from 'http';
import logger from '@/infrastructure/logger/create-logger';

export function setupGracefulShutdown(httpServer: HttpServer, database: DatabasePort, redis: Redis): void {
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down gracefully');

    httpServer.close(async () => {
      await Promise.allSettled([database.disconnect(), redis.disconnect()]);

      logger.info('all connections closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
