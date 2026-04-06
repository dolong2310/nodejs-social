import { protect } from '@/modules/auth/auth.middleware';
import { BaseRoute } from '@/modules/base/base.route';
import { BookmarksController } from '@/modules/bookmarks/bookmarks.controller';
import { PostsValidation } from '@/modules/posts/posts.validation';
import { UsersValidation } from '@/modules/users/users.validation';
import { appLimiter } from '@/shared/middlewares/limiter.middleware';
import { asyncHandler } from '@/utils/handler.util';

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
