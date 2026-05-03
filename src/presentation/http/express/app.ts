import { appConfig } from '@/bootstrap/config/app.config';
import { IContainer } from '@/bootstrap/container';
import logger from '@/infrastructure/logger/create-logger';
import requestContextLogger from '@/infrastructure/logger/request-context-logger';
import { UPLOAD_DIR_VIDEO } from '@/presentation/http/express/constants/file.constant';
import { HttpExceptionFilter } from '@/presentation/http/express/filters/exception.filter';
import { getSwaggerDefinition } from '@/presentation/http/express/utils/file.util';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Router } from 'express';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export function createExpressApp(container: IContainer): Express {
  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors(appConfig.cors));

  app.use(logger.getHttpLogger());
  app.use((req, res, next) => requestContextLogger.bindRequestLogContextMiddleware(req, res, next));

  container.getRouters().forEach((route) => {
    const prefix = appConfig.api.prefix;
    const version = route.getVersion();
    const path = route.getPath();
    const router = route.getRouter();
    app.use(`${prefix}/${version}/${path}`, router);
  });
  app.use('/static/videos', express.static(UPLOAD_DIR_VIDEO));
  app.use(appConfig.api.prefix, setupSwagger());

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
