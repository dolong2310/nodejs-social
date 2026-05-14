import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { ApiKeyGuard } from '@/presentation/http/express/guards/api-key.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IRoleController } from '@/presentation/http/express/v1/controllers/role.controller';
import { IPaginationPipe } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { IRolesPipe } from '@/presentation/http/express/v1/pipes/role.pipe';

export class RoleRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'roles';

  constructor(
    private readonly roleController: IRoleController,
    private readonly rolesPipe: IRolesPipe,
    private readonly paginationPipe: IPaginationPipe,
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
        pipes: [this.paginationPipe.paginationQuery],
        controller: this.roleController.list
      })
    );
    this.router.post(
      '/',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.rolesPipe.createBodyPipe],
        controller: this.roleController.create
      })
    );
    this.router.get(
      '/:roleId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.rolesPipe.roleIdParam],
        controller: this.roleController.getById
      })
    );
    this.router.put(
      '/:roleId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.rolesPipe.roleIdParam, this.rolesPipe.updateBodyPipe],
        controller: this.roleController.update
      })
    );
    this.router.delete(
      '/:roleId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.rolesPipe.roleIdParam],
        controller: this.roleController.remove
      })
    );
  }
}
