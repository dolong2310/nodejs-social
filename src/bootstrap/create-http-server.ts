import { appConfig } from '@/bootstrap/config/app.config';
import { setupContainer } from '@/bootstrap/setup-container';
import { setupDatabase } from '@/bootstrap/setup-database';
import { setupGracefulShutdown } from '@/bootstrap/setup-graceful-shutdown';
import { setupRedis } from '@/bootstrap/setup-redis';
import { setupWorkers } from '@/bootstrap/setup-workers';
import { createExpressApp } from '@/presentation/http/express/app';
import { initUploadsFolder } from '@/presentation/http/express/utils/file.util';
import { createSocketApp } from '@/presentation/socket/socket.app';
import { rateLimit } from 'express-rate-limit';
import { type Server as HttpServer } from 'http';
import { type RedisReply, RedisStore } from 'rate-limit-redis';
import { type Server as SocketIOServer } from 'socket.io';

initUploadsFolder();

export async function createHttpServer(httpServer: HttpServer, io: SocketIOServer) {
  const [database, redis] = await Promise.all([setupDatabase(), setupRedis()]);

  const container = setupContainer(database, redis, io);

  const app = createExpressApp(container);

  createSocketApp(io, container);

  httpServer.on('request', app);

  if (appConfig.rateLimit.enabled) {
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

  setupWorkers(container);

  setupGracefulShutdown(httpServer, database, redis);

  return {
    server: httpServer,
    port: appConfig.port,
    appUrl: appConfig.client.url
  };
}
