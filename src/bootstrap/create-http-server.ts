import { appConfig } from '@/bootstrap/config/app.config';
import { setupContainer } from '@/bootstrap/setup-container';
import { setupDatabase } from '@/bootstrap/setup-database';
import { setupGracefulShutdown } from '@/bootstrap/setup-graceful-shutdown';
import { setupRedis } from '@/bootstrap/setup-redis';
import { setupWorkers } from '@/bootstrap/setup-workers';
import { createExpressApp } from '@/presentation/http/express/app';
import { initUploadsFolder } from '@/presentation/http/express/utils/file.util';
import { createSocketApp } from '@/presentation/socket/socket.app';
import { createServer } from 'http';
import { type Server as SocketServer } from 'socket.io';

initUploadsFolder();

export async function createHttpServer(socketServer: SocketServer) {
  const [database, redis] = await Promise.all([setupDatabase(), setupRedis()]);

  const container = setupContainer(database, redis, socketServer);

  const app = createExpressApp(container);

  const socketApp = createSocketApp(socketServer, container);

  const httpServer = createServer(app);

  socketApp.attach(httpServer);

  setupWorkers(container);

  setupGracefulShutdown(httpServer, database, redis);

  return {
    httpServer,
    port: appConfig.port,
    appUrl: appConfig.client.url
  };
}
