import { SEARCH_THROTTLE_CONFIG } from '@/presentation/http/express/constants/throttler/search.throttler.constants';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import { ActiveUserGuard } from '@/presentation/http/express/guards/active-user.guard';
import { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { ISearchController } from '@/presentation/http/express/v1/controllers/search.controller';
import { IPaginationPipe } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { ISearchPipe } from '@/presentation/http/express/v1/pipes/search.pipe';

export class SearchRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'search';

  constructor(
    private readonly searchController: ISearchController,
    private readonly searchPipe: ISearchPipe,
    private readonly paginationPipe: IPaginationPipe,
    private readonly authOptionGuard: AuthOptionGuard,
    private readonly activeUserGuard: ActiveUserGuard,
    private readonly throttlerGuard: ThrottlerProxyGuard,
    private readonly loggingInterceptor: LoggingInterceptor,
    private readonly transformResponseInterceptor: TransformResponseInterceptor,
    private readonly timeoutInterceptor: TimeoutInterceptor
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const configs: RouterConfig[] = [
      {
        path: '/',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(SEARCH_THROTTLE_CONFIG.SEARCH)],
        guards: [this.authOptionGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.paginationPipe.cursorPaginationQuery, this.searchPipe.searchPipe],
        controller: this.searchController.search
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
