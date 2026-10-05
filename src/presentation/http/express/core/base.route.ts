import type { BaseGuard } from '@/presentation/http/express/core/base.guard';
import type { BaseInterceptor } from '@/presentation/http/express/core/base.interceptor';
import type { BasePipe } from '@/presentation/http/express/core/base.pipe';
import { ForbiddenException } from '@/presentation/http/express/responses/error.response';
import type {
  ControllerHandler,
  ExpressRequest,
  ExpressRequestHandler,
  ExpressResponse,
  RequestSchema
} from '@/presentation/http/express/types';
import { runRequestHandler } from '@/presentation/http/express/utils/request-handler.util';
import { serializeResponse } from '@/presentation/http/express/utils/serialize-response.util';
import express, { type NextFunction, type Router } from 'express';

export interface RouteHandlerOptions {
  middlewares?: ExpressRequestHandler[];
  guards?: BaseGuard[];
  pipes?: BasePipe[];
  interceptors?: BaseInterceptor[];
  response?: RequestSchema;
  controller: ControllerHandler<ExpressRequest, ExpressResponse, NextFunction>;
}

export interface RouterConfig extends RouteHandlerOptions {
  path: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
}

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

  protected createRouteHandler(options: RouteHandlerOptions) {
    const middlewares = options.middlewares ?? [];
    const guards = options.guards ?? [];
    const pipes = options.pipes ?? [];
    const interceptors = options.interceptors ?? [];
    const responseSchema = options.response;
    const controller = options.controller;

    // Request lifecycle: Middleware -> Guard -> Interceptor -> Pipe -> Controller -> Response serializer
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
            await pipe.transform(req, res);
          }

          // 4. Controller
          const result = await controller(req, res, next);

          // 5. Response serializer
          return serializeResponse(result, responseSchema);
        };

        // 6. Interceptors wrap pipe + controller + response serializer
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
