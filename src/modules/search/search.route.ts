/*
 * This file defines the search routes for searching posts and users.
 */

import { BaseRoute, ISearchController, ISearchValidation, protectIfHasBearerToken } from '@/modules';
import { appLimiter, validatePaginationQuery } from '@/shared';
import { asyncHandler } from '@/utils';

export class SearchRoute extends BaseRoute {
  private searchController!: ISearchController;
  private searchValidation!: ISearchValidation;

  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    // Initialize the controller here, after the container is available
    this.searchController = this.container.getSearchController();
    this.searchValidation = this.container.getSearchValidation();

    this.router.get(
      '/',
      appLimiter,
      protectIfHasBearerToken,
      validatePaginationQuery,
      this.searchValidation.searchValidation,
      asyncHandler(this.searchController.search)
    );
  }
}

export function searchRouter() {
  return new SearchRoute().getRouter();
}
