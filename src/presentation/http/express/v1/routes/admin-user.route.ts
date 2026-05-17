import { BaseRoute } from '@/presentation/http/express/core/base.route';
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

    this.router.get(
      '/',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.paginationPipe.paginationQuery],
        controller: this.adminUserController.list
      })
    );

    this.router.post(
      '/',
      this.createRouteHandler({
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
      })
    );

    this.router.get(
      '/:userId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.adminUsersPipe.userIdParam()],
        controller: this.adminUserController.getById
      })
    );

    this.router.put(
      '/:userId',
      this.createRouteHandler({
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
      })
    );

    this.router.delete(
      '/:userId',
      this.createRouteHandler({
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
      })
    );
  }
}
