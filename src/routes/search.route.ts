/*
 * This file defines the search routes for searching posts and users.
 */

import { ISearchController } from '@/controllers/search.controller';
import { protectIfHasBearerToken } from '@/middlewares/auth.middleware';
import { validatePaginationQuery } from '@/middlewares/common.middleware';
import { appLimiter } from '@/middlewares/limiter.middleware';
import { BaseRoute } from '@/routes/base.route';
import { asyncHandler } from '@/utils/handler.util';
import { ISearchValidation } from '@/validations/search.validation';

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

// Create instance and export router for backward compatibility
export default () => {
  const searchRoute = new SearchRoute();
  return searchRoute.getRouter();
};
