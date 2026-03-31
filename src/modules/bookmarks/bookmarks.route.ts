/*
 * This file defines the bookmarks routes for creating bookmark, deleting bookmark.
 */

import { BaseRoute, BookmarksController, PostsValidation, UsersValidation, protect } from '@/modules';
import { appLimiter } from '@/shared';
import { asyncHandler } from '@/utils';

class BookmarksRoute extends BaseRoute {
  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    const { createBookmark, deleteBookmark } = this.container.get(BookmarksController);
    const { attachAuthenticatedUserAllowUnverified, forbidUnverifiedEngagement } = this.container.get(UsersValidation);
    const { postIdValidation, audienceValidation } = this.container.get(PostsValidation);

    this.router.post(
      '/',
      appLimiter,
      protect,
      attachAuthenticatedUserAllowUnverified,
      forbidUnverifiedEngagement,
      postIdValidation('postId', 'body'),
      audienceValidation,
      asyncHandler(createBookmark)
    );
    this.router.delete(
      '/posts/:postId',
      appLimiter,
      protect,
      attachAuthenticatedUserAllowUnverified,
      forbidUnverifiedEngagement,
      postIdValidation('postId', 'params'),
      audienceValidation,
      asyncHandler(deleteBookmark)
    );
  }
}

export function bookmarksRouter() {
  return new BookmarksRoute().getRouter();
}
