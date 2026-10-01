import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import { ApiKeyGuard } from '@/presentation/http/express/guards/api-key.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IAdminUserController } from '@/presentation/http/express/v1/controllers/admin-user.controller';
import { IAdminUsersPipe } from '@/presentation/http/express/v1/pipes/admin-user.pipe';
import { IPaginationPipe } from '@/presentation/http/express/v1/pipes/pagination.pipe';

export class AdminUserRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'admin/users';

  constructor(
    private readonly adminUserController: IAdminUserController,
    private readonly adminUsersPipe: IAdminUsersPipe,
    private readonly paginationPipe: IPaginationPipe,
    private readonly authGuard: AuthGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
    private readonly throttlerGuard: ThrottlerProxyGuard,
    private readonly loggingInterceptor: LoggingInterceptor,
    private readonly transformResponseInterceptor: TransformResponseInterceptor,
    private readonly timeoutInterceptor: TimeoutInterceptor,
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
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.paginationPipe.paginationQuery],
        controller: this.adminUserController.list
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
        pipes: [this.adminUsersPipe.createBodyPipe()],
        controller: this.adminUserController.create
      },
      {
        path: '/:userId',
        method: 'get',
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.adminUsersPipe.userIdParam()],
        controller: this.adminUserController.getById
      },
      {
        path: '/:userId',
        method: 'put',
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.adminUsersPipe.userIdParam(), this.adminUsersPipe.updateBodyPipe()],
        controller: this.adminUserController.update
      },
      {
        path: '/:userId',
        method: 'delete',
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.adminUsersPipe.userIdParam()],
        controller: this.adminUserController.remove
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
