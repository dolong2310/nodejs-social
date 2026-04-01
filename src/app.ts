import { config } from '@/config/generalConfig';
import { UPLOAD_DIR_VIDEO } from '@/constants/file.constant';
import { AppConfig } from '@/interfaces/types/app.type';
import { authRouter } from '@/modules/auth/auth.route';
import { blocksRouter } from '@/modules/blocks/blocks.route';
import { bookmarksRouter } from '@/modules/bookmarks/bookmarks.route';
import { ConversationMemberRepository } from '@/modules/conversations/conversationMember.repository';
import { conversationsRouter } from '@/modules/conversations/conversations.route';
import { friendsRouter } from '@/modules/friends/friends.route';
import { FriendshipRepository } from '@/modules/friends/friendship.repository';
import { likesRouter } from '@/modules/likes/likes.route';
import { mediaRouter } from '@/modules/media/media.route';
import { staticRouter } from '@/modules/media/static.route';
import { notificationsRouter } from '@/modules/notifications/notifications.route';
import { oauthRouter } from '@/modules/oauth/oauth.route';
import { postsRouter } from '@/modules/posts/posts.route';
import { searchRouter } from '@/modules/search/search.route';
import { usersRouter } from '@/modules/users/users.route';
import { UsersService } from '@/modules/users/users.service';
import { Container } from '@/providers/container/instance.container';
import { DatabaseInstance } from '@/providers/database/mongodb/database.instance';
import { RedisInstance } from '@/providers/database/redis/redis.instance';
import { LoggerInstance } from '@/providers/logger/instance.logger';
import { RequestContextLogger } from '@/providers/logger/request-context.logger';
import { QueueInstance } from '@/providers/queue/queue.instance';
import { QueueService } from '@/providers/queue/queue.service';
import { errorHandler } from '@/shared/middlewares/error.middleware';
import { SocketService } from '@/shared/services/socket.service';
import { ChatFeature } from '@/shared/services/socket/features/chat.feature';
import { PresenceFeature } from '@/shared/services/socket/features/presence.feature';
import { TokenService } from '@/shared/services/token.service';
import { getSwaggerDefinition } from '@/utils/file.util';
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
  const queueService = QueueInstance.init(appConfig.redis);
  await Promise.all([
    databaseService.connect(),
    databaseService.initializeIndexes(),
    databaseService.initializeConversationIndexes(),
    redisService.connect(),
    queueService.connect()
  ]);

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

  const container = Container.getOrSet(databaseService, redisService); // init Container
  const socket = setupSocket(httpServer, container);
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

function setupSocket(httpServer: HttpServer, container: Container): SocketService {
  const socket = new SocketService(httpServer, {
    tokenService: container.get(TokenService),
    usersService: container.get(UsersService),
    features: [
      new PresenceFeature(container.get(FriendshipRepository)),
      new ChatFeature(container.get(ConversationMemberRepository))
    ]
  });
  container.bindNotificationsSocket(socket);
  container.bindRealtimeChatEmitter(socket);
  return socket;
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
