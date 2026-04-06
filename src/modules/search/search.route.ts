import { protectIfHasBearerToken } from '@/modules/auth/auth.middleware';
import { BaseRoute } from '@/modules/base/base.route';
import { SearchController } from '@/modules/search/search.controller';
import { SearchValidation } from '@/modules/search/search.validation';
import { validateCursorPaginationQuery } from '@/shared/middlewares/common.middleware';
import { appLimiter } from '@/shared/middlewares/limiter.middleware';
import { asyncHandler } from '@/utils/handler.util';

export class SearchRoute extends BaseRoute {
  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    const { search } = this.container.get(SearchController);
    const { searchValidation } = this.container.get(SearchValidation);

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

export function searchRouter() {
  return new SearchRoute().getRouter();
}
