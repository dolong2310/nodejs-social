/*
 * This file defines the bookmarks routes for creating bookmark, deleting bookmark.
 */

import { BaseRoute, IBookmarksController, IPostsValidation, IUsersValidation, protect } from '@/modules';
import { appLimiter } from '@/shared';
import { asyncHandler } from '@/utils';

class BookmarksRoute extends BaseRoute {
  private bookmarksController!: IBookmarksController;
  private usersValidation!: IUsersValidation;
  private postsValidation!: IPostsValidation;

  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    // Initialize the controller here, after the container is available
    this.bookmarksController = this.container.getBookmarksController();
    this.usersValidation = this.container.getUsersValidation();
    this.postsValidation = this.container.getPostsValidation();

    this.router.post(
      '/',
      appLimiter,
      protect,
      this.usersValidation.attachAuthenticatedUserAllowUnverified,
      this.usersValidation.forbidUnverifiedEngagement,
      this.postsValidation.postIdValidation('postId', 'body'),
      this.postsValidation.audienceValidation,
      asyncHandler(this.bookmarksController.createBookmark)
    );
    this.router.delete(
      '/posts/:postId',
      appLimiter,
      protect,
      this.usersValidation.attachAuthenticatedUserAllowUnverified,
      this.usersValidation.forbidUnverifiedEngagement,
      this.postsValidation.postIdValidation('postId', 'params'),
      this.postsValidation.audienceValidation,
      asyncHandler(this.bookmarksController.deleteBookmark)
    );
  }
}

export function bookmarksRouter() {
  return new BookmarksRoute().getRouter();
}
