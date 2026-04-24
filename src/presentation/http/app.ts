import { appConfig } from '@/bootstrap/config/app.config';
import { IContainer } from '@/bootstrap/container';
import { UPLOAD_DIR_VIDEO } from '@/presentation/http/constants/file.constant';
import { errorHandler } from '@/presentation/http/middlewares/error.middleware';
import { getSwaggerDefinition } from '@/presentation/http/utils/file.util';
import cookieParser from 'cookie-parser';
import express, { Express, Router } from 'express';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export function createExpressApp(container: IContainer): Express {
  const app = express();

  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());

  container.getRouters().forEach((route) => {
    app.use(appConfig.api.prefix + route.getPath(), route.getRouter());
  });
  app.use('/static/videos', express.static(UPLOAD_DIR_VIDEO));
  app.use(appConfig.api.prefix, setupSwagger());

  app.use(errorHandler);

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
