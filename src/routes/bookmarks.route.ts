/*
 * This file defines the bookmarks routes for creating bookmark, deleting bookmark.
 */

import { IBookmarksController } from '@/controllers/bookmarks.controller';
import { protect } from '@/middlewares/auth.middleware';
import { appLimiter } from '@/middlewares/limiter.middleware';
import { BaseRoute } from '@/routes/base.route';
import { asyncHandler } from '@/utils/handler.util';
import { IPostsValidation } from '@/validations/posts.validation';
import { IUsersValidation } from '@/validations/users.validation';

export class BookmarksRoute extends BaseRoute {
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
      this.usersValidation.userVerifiedValidation,
      this.postsValidation.postIdValidation('postId', 'body'),
      asyncHandler(this.bookmarksController.createBookmark)
    );
    this.router.delete(
      '/posts/:postId',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.postsValidation.postIdValidation('postId', 'params'),
      asyncHandler(this.bookmarksController.deleteBookmark)
    );
  }
}

// Create instance and export router for backward compatibility
export default () => {
  const bookmarksRoute = new BookmarksRoute();
  return bookmarksRoute.getRouter();
};
