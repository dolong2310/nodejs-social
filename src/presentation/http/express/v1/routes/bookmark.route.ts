import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
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
    private readonly authGuard: AuthGuard,
    private readonly throttler: ThrottlerProxyGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { createBookmark, deleteBookmark } = this.bookmarkController;
    const { userActiveValidator } = this.userValidator;
    const { postIdValidator } = this.postValidator;
    const authGuard = this.authGuard.handler;
    const throttler = this.throttler.handler();

    this.router.post(
      '/',
      throttler,
      authGuard,
      userActiveValidator,
      postIdValidator('postId', 'body'),
      asyncHandler(createBookmark)
    );
    this.router.delete(
      '/posts/:postId',
      throttler,
      authGuard,
      userActiveValidator,
      postIdValidator('postId', 'params'),
      asyncHandler(deleteBookmark)
    );
  }
}
