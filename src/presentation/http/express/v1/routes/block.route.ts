import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import { ActiveUserGuard } from '@/presentation/http/express/guards/active-user.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IBlockController } from '@/presentation/http/express/v1/controllers/block.controller';
import { IBlockPipe } from '@/presentation/http/express/v1/pipes/block.pipe';
import { IPaginationPipe } from '@/presentation/http/express/v1/pipes/pagination.pipe';

export class BlockRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'blocks';

  constructor(
    private readonly blockController: IBlockController,
    private readonly blockPipe: IBlockPipe,
    private readonly paginationPipe: IPaginationPipe,
    private readonly authGuard: AuthGuard,
    private readonly activeUserGuard: ActiveUserGuard,
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
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.paginationPipe.paginationQuery],
        controller: this.blockController.listBlocked
      },
      {
        path: '/',
        method: 'post',
        middlewares: [throttler],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.blockPipe.blockUserBodyPipe],
        controller: this.blockController.blockUser
      },
      {
        path: '/:userId',
        method: 'delete',
        middlewares: [throttler],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.blockPipe.unblockUserIdPipe],
        controller: this.blockController.unblockUser
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
