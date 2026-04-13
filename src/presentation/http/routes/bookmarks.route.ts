import { IBookmarksController } from '@/presentation/http/controllers/bookmarks.controller';
import { protect } from '@/presentation/http/middlewares/auth.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IPostsValidation } from '@/presentation/http/validators/posts.validator';
import { IUsersValidation } from '@/presentation/http/validators/users.validator';

export class BookmarksRoute extends BaseRoute {
  constructor(
    private readonly bookmarksController: IBookmarksController,
    private readonly usersValidation: IUsersValidation,
    private readonly postsValidation: IPostsValidation
  ) {
    super('/bookmarks');
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    const { createBookmark, deleteBookmark } = this.bookmarksController;
    const { attachAuthenticatedUserAllowUnverified, forbidUnverifiedEngagement } = this.usersValidation;
    const { postIdValidation, audienceValidation } = this.postsValidation;

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
