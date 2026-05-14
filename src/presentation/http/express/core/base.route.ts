import type { BaseGuard } from '@/presentation/http/express/core/base.guard';
import type { BaseInterceptor } from '@/presentation/http/express/core/base.interceptor';
import { ForbiddenException } from '@/presentation/http/express/responses/error.response';
import type {
  ControllerHandler,
  ExpressRequest,
  ExpressRequestHandler,
  ExpressResponse
} from '@/presentation/http/express/types';
import { runRequestHandler } from '@/presentation/http/express/utils/request-handler.util';
import express, { NextFunction, Router } from 'express';

export abstract class BaseRoute {
  protected router: Router;
  protected abstract readonly version: string;
  protected abstract readonly pathName: string;

  constructor() {
    this.router = express.Router();
  }

  public getRouter(): Router {
    return this.router;
  }

  public getVersion(): string {
    return this.version;
  }

  public getPath(): string {
    return this.pathName;
  }

  protected abstract createRoutes(): void;

  protected createRouteHandler(options: {
    middlewares?: ExpressRequestHandler[];
    guards?: BaseGuard[];
    pipes?: ExpressRequestHandler[];
    // pipes?: BasePipe[];
    interceptors?: BaseInterceptor[];
    controller: ControllerHandler<ExpressRequest, ExpressResponse, NextFunction>;
  }) {
    const middlewares = options.middlewares ?? [];
    const guards = options.guards ?? [];
    const pipes = options.pipes ?? [];
    const interceptors = options.interceptors ?? [];
    const controller = options.controller;

    // Request lifecycle: Middleware -> Guard -> Interceptor -> Pipe -> Controller
    return async function routeHandler(req: ExpressRequest, res: ExpressResponse, next: NextFunction) {
      try {
        // 1. Middlewares
        for (const middleware of middlewares) {
          await runRequestHandler(middleware, req, res);
          if (res.headersSent) return;
        }

        // 2. Guards
        for (const guard of guards) {
          const allowed = await guard.canActivate(req);

          if (!allowed) {
            return next(new ForbiddenException('You are not authorized to access this resource'));
          }
        }

        const pipelineAfterInterceptor = async () => {
          // 3. Pipes
          for (const pipe of pipes) {
            // await pipe.transform(req, res, next);
            await runRequestHandler(pipe, req, res);
            if (res.headersSent) return;
          }

          // 4. Controller
          return controller(req, res, next);
        };

        // 5. Interceptors wrap pipe + controller
        const handler = interceptors.reduceRight(
          (nextInterceptor: () => Promise<unknown>, interceptor: BaseInterceptor) => () => {
            return Promise.resolve(interceptor.intercept(req, res, nextInterceptor));
          },
          pipelineAfterInterceptor
        );

        await handler();
      } catch (error) {
        next(error);
      }
    };
  }
}
