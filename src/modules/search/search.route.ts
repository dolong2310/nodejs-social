/*
 * This file defines the search routes for searching posts and users.
 */

import { BaseRoute, SearchController, SearchValidation, protectIfHasBearerToken } from '@/modules';
import { appLimiter, validatePaginationQuery } from '@/shared';
import { asyncHandler } from '@/utils';

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
      validatePaginationQuery,
      searchValidation,
      asyncHandler(search)
    );
  }
}

export function searchRouter() {
  return new SearchRoute().getRouter();
}
