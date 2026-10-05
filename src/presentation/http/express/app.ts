import { APP_CONFIG } from '@/bootstrap/config/app.config';
import { envConfig } from '@/bootstrap/config/env.config';
import type { IContainer } from '@/bootstrap/container';
import requestContextLogger from '@/infrastructure/logger/request-context-logger';
import { createRateLimitStore } from '@/infrastructure/persistence/redis/rate-limit-store';
import { UPLOAD_DIR_VIDEO } from '@/presentation/http/express/constants/file.constants';
import { RATE_LIMIT_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { HttpExceptionFilter } from '@/presentation/http/express/filters/exception.filter';
import { notFoundMiddleware } from '@/presentation/http/express/middlewares/not-found.middleware';
import { HTTP_ERROR_MESSAGE } from '@/presentation/http/express/responses/http-message.constants';
import { HTTP_STATUS } from '@/presentation/http/express/responses/http-status.constants';
import { getSwaggerDefinition } from '@/presentation/http/express/utils/file.util';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export function createExpressApp(container: IContainer): Express {
  const routers = container.getRouters();

  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors({ origin: APP_CONFIG.CORS.ORIGIN, credentials: APP_CONFIG.CORS.CREDENTIALS }));

  // app.use(logger.getHttpLogger());
  app.use((req, res, next) => requestContextLogger.bindRequestLogContextMiddleware(req, res, next));

  if (envConfig.RATE_LIMIT_ENABLED) {
    const { redis } = container.getContext();

    app.use(
      rateLimit({
        windowMs: envConfig.RATE_LIMIT_WINDOW_MS,
        limit: envConfig.RATE_LIMIT_MAX,
        standardHeaders: APP_CONFIG.RATE_LIMIT.STANDARD_HEADERS,
        legacyHeaders: APP_CONFIG.RATE_LIMIT.LEGACY_HEADERS,
        ipv6Subnet: APP_CONFIG.RATE_LIMIT.IPV6_SUBNET,
        message: {
          statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
          error: HTTP_ERROR_MESSAGE.TOO_MANY_REQUESTS,
          message: RATE_LIMIT_ERROR_MESSAGE.TOO_MANY_REQUESTS
        },
        store: createRateLimitStore(redis)
      })
    );
  }

  routers.forEach((route) => {
    const prefix = APP_CONFIG.API.PREFIX;
    const version = route.getVersion();
    const path = route.getPath();
    const router = route.getRouter();
    app.use(`${prefix}/${version}/${path}`, router);
  });
  app.use('/static/videos', express.static(UPLOAD_DIR_VIDEO));
  app.use(APP_CONFIG.API.PREFIX, setupSwagger());

  app.use(notFoundMiddleware);

  app.use(HttpExceptionFilter.catch);

  return app;
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
