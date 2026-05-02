import { AuthGuard } from '@/presentation/http/express/middlewares/auth.guard';
import { validateCursorPaginationQuery } from '@/presentation/http/express/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/express/middlewares/limiter.middleware';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { ISearchController } from '@/presentation/http/express/v1/controllers/search.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { ISearchValidator } from '@/presentation/http/express/v1/validators/search.validator';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export class SearchRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'search';

  constructor(
    private readonly searchController: ISearchController,
    private readonly searchValidator: ISearchValidator,
    private readonly userValidator: IUserValidator,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { search } = this.searchController;
    const { searchValidator } = this.searchValidator;
    const { userActiveValidator } = this.userValidator;
    const { optionalAuth } = this.authGuard;

    this.router.get(
      '/',
      appLimiter,
      optionalAuth(userActiveValidator),
      validateCursorPaginationQuery,
      searchValidator,
      asyncHandler(search)
    );
  }
}
