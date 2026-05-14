import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { ISearchController } from '@/presentation/http/express/v1/controllers/search.controller';
import { validateCursorPaginationQuery } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { ISearchPipe } from '@/presentation/http/express/v1/pipes/search.pipe';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';

export class SearchRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'search';

  constructor(
    private readonly searchController: ISearchController,
    private readonly searchPipe: ISearchPipe,
    private readonly userPipe: IUserPipe,
    private readonly authOptionGuard: AuthOptionGuard,
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
        guards: [this.authOptionGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validateCursorPaginationQuery, this.userPipe.userActivePipe, this.searchPipe.searchPipe],
        controller: this.searchController.search
      })
    );
  }
}
