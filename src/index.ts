import { UPLOAD_DIR_VIDEO } from '@/constants/file.constant';
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
import { DatabaseSingleton } from '@/services/database.singleton';
import SocketService from '@/services/socket.service';
import { getSwaggerDefinition } from '@/utils/file.util';
import cors, { CorsOptions } from 'cors';
import express, { Express } from 'express';
import { rateLimit, Options as RateLimitOptions } from 'express-rate-limit';
import helmet from 'helmet';
import { Server as HttpServer } from 'http';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

interface AppConfig {
  database: {
    uri: string;
    databaseName: string;
  };
  cors?: CorsOptions;
  rateLimitOptions?: Partial<RateLimitOptions>;
}

export async function createApp(httpServer: HttpServer, config: AppConfig): Promise<Express> {
  const databaseService = DatabaseSingleton.init(config.database);
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

  return app;
}

function setupRoutes(app: Express) {
  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/oauth', oauthRouter);
  app.use('/media', mediaRouter);
  app.use('/static', staticRouter);
  app.use('/posts', postsRouter);
  app.use('/bookmarks', bookmarksRouter);
  app.use('/followers', followersRouter);
  app.use('/search', searchRouter);
  app.use('/conversations', conversationsRouter);
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

// import { envConfig, isProduction } from '@/constants/config.constant';
// import { UPLOAD_DIR_VIDEO } from '@/constants/file.constant';
// import { errorHandler } from '@/middlewares/error.middleware';
// import authRouter from '@/routes/auth.route';
// import bookmarksRouter from '@/routes/bookmarks.route';
// import conversationsRouter from '@/routes/conversations.route';
// import followersRouter from '@/routes/followers.route';
// import mediaRouter from '@/routes/media.route';
// import oauthRouter from '@/routes/oauth.route';
// import postsRouter from '@/routes/posts.route';
// import searchRouter from '@/routes/search.route';
// import staticRouter from '@/routes/static.route';
// import usersRouter from '@/routes/users.route';
// import databaseService from '@/services/database.service';
// import SocketService from '@/services/socket.service';
// import { getSwaggerDefinition, initUploadsFolder } from '@/utils/file.util';
// import cors from 'cors';
// import express from 'express';
// import { rateLimit } from 'express-rate-limit';
// import helmet from 'helmet';
// import { createServer } from 'http';
// import swaggerJsdoc from 'swagger-jsdoc';
// import swaggerUi from 'swagger-ui-express';

// // import fakeData from '@/utils/fake-data';
// // fakeData();

// const port = envConfig.PORT;

// const app = express();
// const httpServer = createServer(app);

// initUploadsFolder();

// // Apply the rate limiting middleware to all requests.
// app.use(
//   rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
//     standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
//     legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
//     ipv6Subnet: 56 // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
//     // store: ... , // Redis, Memcached, etc. See below.
//   })
// );

// app.use(
//   cors({
//     origin: isProduction ? envConfig.FRONTEND_URL : '*',
//     credentials: true
//   })
// );

// app.use(helmet());

// app.use(express.json());

// app.use('/auth', authRouter);
// app.use('/users', usersRouter);
// app.use('/oauth', oauthRouter);
// app.use('/media', mediaRouter);
// app.use('/static', staticRouter);
// app.use('/posts', postsRouter);
// app.use('/bookmarks', bookmarksRouter);
// app.use('/followers', followersRouter);
// app.use('/search', searchRouter);
// app.use('/conversations', conversationsRouter);

// app.use('/static/videos', express.static(UPLOAD_DIR_VIDEO));

// app.use(errorHandler);

// const socket = new SocketService(httpServer);
// socket.run();

// app.use(
//   '/api-docs',
//   swaggerUi.serve,
//   swaggerUi.setup(
//     swaggerJsdoc({
//       definition: getSwaggerDefinition(),
//       apis: ['./swagger/*.yaml']
//     })
//   )
// );

// httpServer.listen(port, () => {
//   databaseService.connect();
//   console.log(`\x1b[32mServer is running on port ${port}\x1b[0m`);
// });
