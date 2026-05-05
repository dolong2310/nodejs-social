import { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { ISearchController } from '@/presentation/http/express/v1/controllers/search.controller';
import { validateCursorPaginationQuery } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { ISearchPipe } from '@/presentation/http/express/v1/pipes/search.pipe';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class SearchRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'search';

  constructor(
    private readonly searchController: ISearchController,
    private readonly searchPipe: ISearchPipe,
    private readonly userPipe: IUserPipe,
    private readonly authOptionGuard: AuthOptionGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { search } = this.searchController;
    const { searchPipe } = this.searchPipe;
    const { userActivePipe } = this.userPipe;
    const authOptionGuard = this.authOptionGuard.handler;
    const throttler = this.throttlerGuard();

    this.router.get(
      '/',
      throttler,
      authOptionGuard,
      userActivePipe,
      validateCursorPaginationQuery,
      searchPipe,
      asyncHandler(this.transformInterceptor(search))
    );
  }
}
