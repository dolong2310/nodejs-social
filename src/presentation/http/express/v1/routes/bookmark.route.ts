import { AuthGuard } from '@/presentation/http/express/middlewares/auth.guard';
import { appLimiter } from '@/presentation/http/express/middlewares/limiter.middleware';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IBookmarkController } from '@/presentation/http/express/v1/controllers/bookmark.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { IPostValidator } from '@/presentation/http/express/v1/validators/post.validator';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export class BookmarkRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'bookmarks';

  constructor(
    private readonly bookmarkController: IBookmarkController,
    private readonly userValidator: IUserValidator,
    private readonly postValidator: IPostValidator,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { createBookmark, deleteBookmark } = this.bookmarkController;
    const { userActiveValidator } = this.userValidator;
    const { postIdValidator } = this.postValidator;
    const { protect } = this.authGuard;

    this.router.post(
      '/',
      appLimiter,
      protect,
      userActiveValidator,
      postIdValidator('postId', 'body'),
      asyncHandler(createBookmark)
    );
    this.router.delete(
      '/posts/:postId',
      appLimiter,
      protect,
      userActiveValidator,
      postIdValidator('postId', 'params'),
      asyncHandler(deleteBookmark)
    );
  }
}
