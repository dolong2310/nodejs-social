import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { ApiKeyGuard } from '@/presentation/http/express/guards/api-key.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IPermissionController } from '@/presentation/http/express/v1/controllers/permission.controller';
import { validatePaginationQuery } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { IPermissionsPipe } from '@/presentation/http/express/v1/pipes/permission.pipe';

export class PermissionRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'permissions';

  constructor(
    private readonly permissionController: IPermissionController,
    private readonly permissionsPipe: IPermissionsPipe,
    private readonly authGuard: AuthGuard,
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

    this.router.get(
      '/',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validatePaginationQuery],
        controller: this.permissionController.list
      })
    );
    this.router.post(
      '/',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.permissionsPipe.createBodyPipe],
        controller: this.permissionController.create
      })
    );
    this.router.get(
      '/:permissionId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.permissionsPipe.permissionIdParam],
        controller: this.permissionController.getById
      })
    );
    this.router.put(
      '/:permissionId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.permissionsPipe.permissionIdParam, this.permissionsPipe.updateBodyPipe],
        controller: this.permissionController.update
      })
    );
    this.router.delete(
      '/:permissionId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.permissionsPipe.permissionIdParam],
        controller: this.permissionController.remove
      })
    );
  }
}
