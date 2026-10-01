import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import { ApiKeyGuard } from '@/presentation/http/express/guards/api-key.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { CacheInterceptor } from '@/presentation/http/express/interceptors/cache.interceptor';
import { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IPermissionController } from '@/presentation/http/express/v1/controllers/permission.controller';
import { IPaginationPipe } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { IPermissionsPipe } from '@/presentation/http/express/v1/pipes/permission.pipe';

export class PermissionRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'permissions';

  constructor(
    private readonly permissionController: IPermissionController,
    private readonly permissionsPipe: IPermissionsPipe,
    private readonly paginationPipe: IPaginationPipe,
    private readonly authGuard: AuthGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
    private readonly throttlerGuard: ThrottlerProxyGuard,
    private readonly loggingInterceptor: LoggingInterceptor,
    private readonly transformResponseInterceptor: TransformResponseInterceptor,
    private readonly timeoutInterceptor: TimeoutInterceptor,
    private readonly cacheInterceptor: CacheInterceptor,
    private readonly idempotencyInterceptor: IdempotencyInterceptor
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const throttler = this.throttlerGuard.handler();

    const configs: RouterConfig[] = [
      {
        path: '/',
        method: 'get',
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.cacheInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.paginationPipe.paginationQuery],
        controller: this.permissionController.list
      },
      {
        path: '/',
        method: 'post',
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.permissionsPipe.createBodyPipe],
        controller: this.permissionController.create
      },
      {
        path: '/:permissionId',
        method: 'get',
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.cacheInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.permissionsPipe.permissionIdParam],
        controller: this.permissionController.getById
      },
      {
        path: '/:permissionId',
        method: 'put',
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.permissionsPipe.permissionIdParam, this.permissionsPipe.updateBodyPipe],
        controller: this.permissionController.update
      },
      {
        path: '/:permissionId',
        method: 'delete',
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.permissionsPipe.permissionIdParam],
        controller: this.permissionController.remove
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
