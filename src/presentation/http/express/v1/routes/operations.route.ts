import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { ApiKeyGuard } from '@/presentation/http/express/guards/api-key.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IOperationsController } from '@/presentation/http/express/v1/controllers/operations.controller';

export class OperationsRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'internal';

  constructor(
    private readonly operationsController: IOperationsController,
    private readonly apiKeyGuard: ApiKeyGuard,
    private readonly throttlerGuard: ThrottlerProxyGuard,
    private readonly loggingInterceptor: LoggingInterceptor,
    private readonly transformResponseInterceptor: TransformResponseInterceptor,
    private readonly timeoutInterceptor: TimeoutInterceptor
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const throttler = this.throttlerGuard.handler();

    this.router.delete(
      '/cache/redis',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.apiKeyGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        controller: this.operationsController.clearRedisCache
      })
    );

    this.router.post(
      '/role-permissions/sync',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.apiKeyGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        controller: this.operationsController.syncRolePermissions
      })
    );
  }
}
