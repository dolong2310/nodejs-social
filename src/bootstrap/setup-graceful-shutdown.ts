import type { DatabasePort } from '@/infrastructure/persistence/database.port';
import type { RedisClientPort } from '@/infrastructure/persistence/redis/redis-client';
import type { WorkerApp } from '@/presentation/worker/worker.app';
import type { Server as HttpServer } from 'http';
import logger from '@/infrastructure/logger/create-logger';

type ShutdownTargets = {
  httpServer?: HttpServer;
  workerApp?: WorkerApp;
  database: DatabasePort;
  redis: RedisClientPort;
};

/**
 * Receive signal
 * -> Stop accepting new requests and jobs
 * -> Finish all pending requests and active jobs
 * -> Cleanup resources
 * -> Close connection
 * -> Exit
 */
export function setupGracefulShutdown({ httpServer, workerApp, database, redis }: ShutdownTargets): void {
  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'shutting down gracefully');

    await Promise.allSettled([
      httpServer ? new Promise<void>((resolve) => httpServer.close(() => resolve())) : undefined,
      workerApp?.close()
    ]);
    await Promise.allSettled([database.disconnect(), redis.disconnect()]);

    logger.info('all connections closed');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
