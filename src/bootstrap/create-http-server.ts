import logger from '@/infrastructure/logger/create-logger';
import requestContextLogger from '@/infrastructure/logger/request-context-logger';

import { createExpressApp } from '@/presentation/http/app';
import { initUploadsFolder } from '@/presentation/http/utils/file.util';

import { appConfig } from '@/bootstrap/config/app.config';
import { createShutdownResources } from '@/bootstrap/resources';
import { setupContainer } from '@/bootstrap/setup-container';
import { setupDatabase } from '@/bootstrap/setup-database';
import { setupGracefulShutdown } from '@/bootstrap/setup-graceful-shutdown';
import { setupRedis } from '@/bootstrap/setup-redis';
import { setupSocket } from '@/bootstrap/setup-socket';
import { setupWorkers } from '@/bootstrap/setup-workers';

import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { createServer } from 'http';
import { type RedisReply, RedisStore } from 'rate-limit-redis';

export async function createHttpServer() {
  const httpServer = createServer();

  initUploadsFolder();

  const [database, redis] = await Promise.all([setupDatabase(), setupRedis()]);

  const container = setupContainer(database, redis);

  const app = createExpressApp(container);

  httpServer.on('request', app);

  if (appConfig.cors) {
    app.use(cors(appConfig.cors));
  }

  if (appConfig.rateLimit?.enabled) {
    app.use(
      rateLimit({
        windowMs: appConfig.rateLimit.windowMs,
        limit: appConfig.rateLimit.limit,
        standardHeaders: appConfig.rateLimit.standardHeaders,
        legacyHeaders: appConfig.rateLimit.legacyHeaders,
        ipv6Subnet: appConfig.rateLimit.ipv6Subnet,
        // Lưu bộ đếm trên Redis thay vì RAM process — cần khi nhiều instance hoặc restart không mất counter.
        store: new RedisStore({
          sendCommand: (...args: string[]) => redis.sendRawCommand(...args) as Promise<RedisReply>
        })
      })
    );
  }

  setupSocket(httpServer, container);
  setupWorkers(container);

  const resources = createShutdownResources(database, redis);
  setupGracefulShutdown(httpServer, resources);

  app.use(logger.getHttpLogger());
  app.use(requestContextLogger.bindRequestLogContextMiddleware);

  return {
    server: httpServer,
    port: appConfig.port
  };
}
