import { IBookmarkController } from '@/presentation/http/controllers/bookmark.controller';
import { protect } from '@/presentation/http/middlewares/auth.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IPostValidator } from '@/presentation/http/validators/post.validator';
import { IUserValidator } from '@/presentation/http/validators/user.validator';

export class BookmarkRoute extends BaseRoute {
  protected override readonly pathName = '/bookmarks';

  constructor(
    private readonly bookmarkController: IBookmarkController,
    private readonly userValidator: IUserValidator,
    private readonly postValidator: IPostValidator
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { createBookmark, deleteBookmark } = this.bookmarkController;
    const { attachAuthenticatedUserAllowUnverified, forbidUnverifiedEngagement } = this.userValidator;
    const { postIdValidator, audienceValidator } = this.postValidator;

    this.router.post(
      '/',
      appLimiter,
      protect,
      attachAuthenticatedUserAllowUnverified,
      forbidUnverifiedEngagement,
      postIdValidator('postId', 'body'),
      audienceValidator,
      asyncHandler(createBookmark)
    );
    this.router.delete(
      '/posts/:postId',
      appLimiter,
      protect,
      attachAuthenticatedUserAllowUnverified,
      forbidUnverifiedEngagement,
      postIdValidator('postId', 'params'),
      audienceValidator,
      asyncHandler(deleteBookmark)
    );
  }
}
