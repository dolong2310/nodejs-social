import { PERMISSION_THROTTLE_CONFIG } from '@/presentation/http/express/constants/throttler/permission.throttler.constants';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import type { ApiKeyGuard } from '@/presentation/http/express/guards/api-key.guard';
import type { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import type { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import type { CacheInterceptor } from '@/presentation/http/express/interceptors/cache.interceptor';
import type { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import type { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import type { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import type { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import type { IPermissionController } from '@/presentation/http/express/v1/controllers/permission.controller';
import type { IPaginationPipe } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import type { IPermissionsPipe } from '@/presentation/http/express/v1/pipes/permission.pipe';

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
    const configs: RouterConfig[] = [
      {
        path: '/',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(PERMISSION_THROTTLE_CONFIG.LIST)],
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
        middlewares: [this.throttlerGuard.handler(PERMISSION_THROTTLE_CONFIG.CREATE)],
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
        middlewares: [this.throttlerGuard.handler(PERMISSION_THROTTLE_CONFIG.GET_BY_ID)],
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
        middlewares: [this.throttlerGuard.handler(PERMISSION_THROTTLE_CONFIG.UPDATE)],
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
        middlewares: [this.throttlerGuard.handler(PERMISSION_THROTTLE_CONFIG.REMOVE)],
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
