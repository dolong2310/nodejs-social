import { setupDatabase } from '@/bootstrap/setup-database';
import { setupGracefulShutdown } from '@/bootstrap/setup-graceful-shutdown';
import { setupRedis } from '@/bootstrap/setup-redis';
import { WorkerContainer } from '@/bootstrap/worker-container';
import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { buildBullMQConnection } from '@/infrastructure/queue/bullmq/bullmq-connection';
import { createWorkerApp, type WorkerApp } from '@/presentation/worker/worker.app';

export async function createWorker(): Promise<WorkerApp> {
  const [database, redis] = await Promise.all([setupDatabase(), setupRedis()]);

  const container = new WorkerContainer(database, redis);

  const workerApp = createWorkerApp(buildBullMQConnection(dbConfig.redis), container);

  setupGracefulShutdown({ workerApp, database, redis });

  return workerApp;
}
