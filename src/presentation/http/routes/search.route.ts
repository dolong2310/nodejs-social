import { ISearchController } from '@/presentation/http/controllers/search.controller';
import { protectIfHasBearerToken } from '@/presentation/http/middlewares/auth.middleware';
import { validateCursorPaginationQuery } from '@/presentation/http/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { ISearchValidator } from '@/presentation/http/validators/search.validator';

export class SearchRoute extends BaseRoute {
  protected override readonly pathName = '/search';

  constructor(
    private readonly searchController: ISearchController,
    private readonly searchValidator: ISearchValidator
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { search } = this.searchController;
    const { searchValidator } = this.searchValidator;

    this.router.get(
      '/',
      appLimiter,
      protectIfHasBearerToken,
      validateCursorPaginationQuery,
      searchValidator,
      asyncHandler(search)
    );
  }
}
