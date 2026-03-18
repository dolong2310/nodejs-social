import { UPLOAD_DIR_VIDEO } from '@/constants/file.constant';
import { DatabaseInstance } from '@/database';
import { errorHandler } from '@/middlewares/error.middleware';
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
import express, { Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { Server as HttpServer } from 'http';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export async function createApp(httpServer: HttpServer, config: AppConfig): Promise<Express> {
  const databaseService = DatabaseInstance.init(config.database);
  await databaseService.connect();

  const app = createExpressApp();
  httpServer.on('request', app);

  if (config.cors) {
    app.use(cors(config.cors));
  }

  if (config.rateLimitOptions) {
    app.use(rateLimit(config.rateLimitOptions));
  }

  const socket = new SocketService(httpServer);
  socket.run();

  setupRoutes(app);
  setupSwagger(app);

  return app;
}

function createExpressApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());

  return app;
}

function setupRoutes(app: Express) {
  app.use('/auth', authRouter());
  app.use('/users', usersRouter());
  app.use('/oauth', oauthRouter());
  app.use('/media', mediaRouter());
  app.use('/static', staticRouter());
  app.use('/posts', postsRouter());
  app.use('/bookmarks', bookmarksRouter());
  app.use('/followers', followersRouter());
  app.use('/search', searchRouter());
  app.use('/conversations', conversationsRouter());
  app.use('/static/videos', express.static(UPLOAD_DIR_VIDEO));
  app.use(errorHandler);
}

function setupSwagger(app: Express) {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(
      swaggerJsdoc({
        definition: getSwaggerDefinition(),
        apis: ['./swagger/*.yaml']
      })
    )
  );
}
