import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IBookmarkController } from '@/presentation/http/express/v1/controllers/bookmark.controller';
import { IPostPipe } from '@/presentation/http/express/v1/pipes/post.pipe';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class BookmarkRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'bookmarks';

  constructor(
    private readonly bookmarkController: IBookmarkController,
    private readonly userPipe: IUserPipe,
    private readonly postPipe: IPostPipe,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { createBookmark, deleteBookmark } = this.bookmarkController;
    const { userActivePipe } = this.userPipe;
    const { postIdPipe } = this.postPipe;
    const authGuard = this.authGuard.handler;
    const throttler = this.throttlerGuard();

    this.router.post(
      '/',
      throttler,
      authGuard,
      userActivePipe,
      postIdPipe('postId', 'body'),
      asyncHandler(this.transformInterceptor(createBookmark))
    );
    this.router.delete(
      '/posts/:postId',
      throttler,
      authGuard,
      userActivePipe,
      postIdPipe('postId', 'params'),
      asyncHandler(this.transformInterceptor(deleteBookmark))
    );
  }
}
