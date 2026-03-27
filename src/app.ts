import { config } from '@/config';
import { UPLOAD_DIR_VIDEO } from '@/constants';
import { AppConfig } from '@/interfaces';
import {
  authRouter,
  blocksRouter,
  bookmarksRouter,
  conversationsRouter,
  friendsRouter,
  likesRouter,
  mediaRouter,
  notificationsRouter,
  oauthRouter,
  postsRouter,
  searchRouter,
  staticRouter,
  usersRouter
} from '@/modules';
import {
  Container,
  DatabaseInstance,
  LoggerInstance,
  QueueService,
  RedisInstance,
  RequestContextLogger
} from '@/providers';
import { errorHandler, SocketService } from '@/shared';
import { getSwaggerDefinition } from '@/utils';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { Server as HttpServer } from 'http';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export async function createApp(httpServer: HttpServer, appConfig: AppConfig): Promise<Express> {
  const databaseService = DatabaseInstance.init(appConfig.database);
  const redisService = RedisInstance.init(appConfig.redis);
  await Promise.all([
    databaseService.connect(),
    databaseService.initializeIndexes(),
    databaseService.initializeConversationIndexes(),
    redisService.connect()
  ]);

  QueueService.init(appConfig.redis); // WARN: QueueService must be initialized before Container — Container.initializeQueues() calls QueueService.get()

  const app = createExpressApp();
  httpServer.on('request', app);

  if (appConfig.cors) {
    app.use(cors(appConfig.cors));
  }

  if (appConfig.rateLimitOptions) {
    if (config.rateLimit.enabled) {
      // Lưu bộ đếm trên Redis thay vì RAM process — cần khi nhiều instance hoặc restart không mất counter.
      appConfig.rateLimitOptions.store = new RedisStore({
        sendCommand: (...args: string[]) => redisService.sendRawCommand(...args) as Promise<RedisReply>
      });
    }

    app.use(rateLimit(appConfig.rateLimitOptions));
  }

  const container = Container.getOrSet(databaseService, redisService);
  const socket = new SocketService(
    httpServer,
    container.getUsersService(),
    container.getConversationMemberRepository(),
    container.getFriendshipRepository()
  );
  container.bindNotificationsSocket(socket);
  container.bindRealtimeChatEmitter(socket);
  socket.run();

  app.use(config.api.prefix, setupRoutes());
  app.use(config.api.prefix, setupSwagger());

  app.use(errorHandler);

  setupGracefulShutdown(httpServer);

  return app;
}

function createExpressApp(): Express {
  const app = express();

  app.use(LoggerInstance.getHttpLogger());
  app.use(RequestContextLogger.bindRequestLogContextMiddleware);
  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());

  return app;
}

function setupRoutes(): Router {
  const router = Router();

  router.use('/auth', authRouter());
  router.use('/users', usersRouter());
  router.use('/oauth', oauthRouter());
  router.use('/media', mediaRouter());
  router.use('/static', staticRouter());
  router.use('/posts', postsRouter());
  router.use('/bookmarks', bookmarksRouter());
  router.use('/likes', likesRouter());
  router.use('/search', searchRouter());
  router.use('/conversations', conversationsRouter());
  router.use('/friends', friendsRouter());
  router.use('/blocks', blocksRouter());
  router.use('/notifications', notificationsRouter());
  router.use('/static/videos', express.static(UPLOAD_DIR_VIDEO));

  return router;
}

function setupSwagger(): Router {
  const router = Router();

  router.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(
      swaggerJsdoc({
        definition: getSwaggerDefinition(),
        apis: ['./swagger/paths.yaml', './swagger/components.yaml', './swagger/tags.yaml', './swagger/security.yaml']
      })
    )
  );

  return router;
}

function setupGracefulShutdown(httpServer: HttpServer): void {
  const shutdown = async (signal: string) => {
    LoggerInstance.getLogger().info({ signal }, 'shutting down gracefully');
    httpServer.close(async () => {
      await Promise.allSettled([
        DatabaseInstance.get().disconnect(),
        RedisInstance.get().disconnect(),
        QueueService.close()
      ]);
      LoggerInstance.getLogger().info('all connections closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
