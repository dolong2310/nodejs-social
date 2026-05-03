import { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { ISearchController } from '@/presentation/http/express/v1/controllers/search.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { validateCursorPaginationQuery } from '@/presentation/http/express/v1/validators/pagination.validator';
import { ISearchValidator } from '@/presentation/http/express/v1/validators/search.validator';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export class SearchRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'search';

  constructor(
    private readonly searchController: ISearchController,
    private readonly searchValidator: ISearchValidator,
    private readonly userValidator: IUserValidator,
    private readonly authOptionGuard: AuthOptionGuard,
    private readonly throttler: ThrottlerProxyGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { search } = this.searchController;
    const { searchValidator } = this.searchValidator;
    const { userActiveValidator } = this.userValidator;
    const authOptionGuard = this.authOptionGuard.handler;
    const throttler = this.throttler.handler();

    this.router.get(
      '/',
      throttler,
      authOptionGuard,
      userActiveValidator,
      validateCursorPaginationQuery,
      searchValidator,
      asyncHandler(search)
    );
  }
}
