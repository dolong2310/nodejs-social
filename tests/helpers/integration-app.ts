import { createApp } from '@/app';
import { config, envConfig } from '@/config';
import { DatabaseInstance } from '@/database/mongodb';
import { RedisInstance } from '@/database/redis';
import { QueueService } from '@/queue';
import type { AddressInfo } from 'node:net';
import { createServer } from 'node:http';

export type IntegrationHttpServer = {
  readonly baseUrl: string;
  readonly httpServer: ReturnType<typeof createServer>;
  close: () => Promise<void>;
};

/**
 * Boots the real app stack on an ephemeral port. Teardown closes the HTTP server and BullMQ workers only;
 * MongoDB and Redis singletons stay open so multiple integration files can run in one Vitest process (serial fork).
 */
export async function startIntegrationHttpServer(): Promise<IntegrationHttpServer> {
  const httpServer = createServer();

  // No global rateLimitOptions: avoids Redis-backed limiter; auth route limiter is skipped when VITEST=true.
  await createApp(httpServer, {
    database: {
      uri: config.database.uri,
      databaseName: config.database.name,
      chatDatabaseName: envConfig.DATABASE_CHAT_NAME
    },
    redis: config.redis,
    cors: {
      origin: envConfig.FRONTEND_URL,
      credentials: true
    }
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(0, '127.0.0.1', () => {
      httpServer.off('error', reject);
      resolve();
    });
  });

  const addr = httpServer.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  return {
    baseUrl,
    httpServer,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      });
      await QueueService.close();
    }
  };
}

export { DatabaseInstance };
