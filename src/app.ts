import { config } from '@/config';
import { UPLOAD_DIR_VIDEO } from '@/constants/file.constant';
import { Container } from '@/container';
import { DatabaseInstance } from '@/database/mongodb';
import { RedisInstance } from '@/database/redis';
import { httpLogger, logger } from '@/logger';
import { bindRequestLogContextMiddleware } from '@/logger/request-context';
import { errorHandler } from '@/middlewares/error.middleware';
import { QueueService } from '@/queue';
import authRouter from '@/routes/auth.route';
import bookmarksRouter from '@/routes/bookmarks.route';
import conversationsRouter from '@/routes/conversations.route';
import followersRouter from '@/routes/followers.route';
import mediaRouter from '@/routes/media.route';
import oauthRouter from '@/routes/oauth.route';
import postsRouter from '@/routes/posts.route';
import searchRouter from '@/routes/search.route';
import staticRouter from '@/routes/static.route';
import usersRouter from '@/routes/users.route';
import SocketService from '@/services/socket.service';
import { AppConfig } from '@/types/app.type';
import { getSwaggerDefinition } from '@/utils/file.util';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { Server as HttpServer } from 'http';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export async function createApp(httpServer: HttpServer, appConfig: AppConfig): Promise<Express> {
  const databaseService = DatabaseInstance.init(appConfig.database);
  const redisService = RedisInstance.init(appConfig.redis);
  await Promise.all([databaseService.connect(), databaseService.initializeIndexes(), redisService.connect()]);

  QueueService.init(appConfig.redis); // WARN: QueueService must be initialized before Container — Container.initializeQueues() calls QueueService.get()

  const app = createExpressApp();
  httpServer.on('request', app);

  if (appConfig.cors) {
    app.use(cors(appConfig.cors));
  }

  if (appConfig.rateLimitOptions) {
    app.use(rateLimit(appConfig.rateLimitOptions));
  }

  const container = Container.getOrSet(databaseService, redisService);
  const socket = new SocketService(httpServer, container.getUsersService());
  socket.run();

  app.use(config.api.prefix, setupRoutes());
  app.use(config.api.prefix, setupSwagger());

  app.use(errorHandler);

  setupGracefulShutdown(httpServer);

  return app;
}

function createExpressApp(): Express {
  const app = express();

  app.use(httpLogger);
  app.use(bindRequestLogContextMiddleware);
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
  router.use('/followers', followersRouter());
  router.use('/search', searchRouter());
  router.use('/conversations', conversationsRouter());
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
    logger.info({ signal }, 'shutting down gracefully');
    httpServer.close(async () => {
      await Promise.allSettled([
        DatabaseInstance.get().close(),
        RedisInstance.get().disconnect(),
        QueueService.close()
      ]);
      logger.info('all connections closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
