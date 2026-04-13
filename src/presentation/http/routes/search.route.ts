import { ISearchController } from '@/presentation/http/controllers/search.controller';
import { protectIfHasBearerToken } from '@/presentation/http/middlewares/auth.middleware';
import { validateCursorPaginationQuery } from '@/presentation/http/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { ISearchValidation } from '@/presentation/http/validators/search.validator';

export class SearchRoute extends BaseRoute {
  constructor(
    private readonly searchController: ISearchController,
    private readonly searchValidation: ISearchValidation
  ) {
    super('/search');
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    const { search } = this.searchController;
    const { searchValidation } = this.searchValidation;

    this.router.get(
      '/',
      appLimiter,
      protectIfHasBearerToken,
      validateCursorPaginationQuery,
      searchValidation,
      asyncHandler(search)
    );
  }
}
