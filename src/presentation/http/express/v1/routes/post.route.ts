import { THROTTLE } from '@/presentation/http/express/constants/throttler.constant';
import { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IPostController } from '@/presentation/http/express/v1/controllers/post.controller';
import { validateCursorPaginationQuery } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { IPostPipe } from '@/presentation/http/express/v1/pipes/post.pipe';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class PostRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'posts';

  constructor(
    private readonly postController: IPostController,
    private readonly postPipe: IPostPipe,
    private readonly userPipe: IUserPipe,
    private readonly authGuard: AuthGuard,
    private readonly authOptionGuard: AuthOptionGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { getNewFeeds, patchPost, getPostDetail, getPostsType, createPost } = this.postController;
    const { postIdPipe, patchPostPipe, postTypePipe, createPostPipe } = this.postPipe;
    const { userActivePipe } = this.userPipe;
    const authGuard = this.authGuard.handler;
    const authOptionGuard = this.authOptionGuard.handler;
    const throttler = this.throttlerGuard(THROTTLE.POSTS.WINDOW_MS, THROTTLE.POSTS.MAX);

    this.router.get(
      '/',
      throttler,
      authOptionGuard,
      userActivePipe,
      validateCursorPaginationQuery,
      asyncHandler(this.transformInterceptor(getNewFeeds))
    );
    this.router.patch(
      '/:postId',
      throttler,
      authGuard,
      userActivePipe,
      postIdPipe('postId', 'params'),
      patchPostPipe,
      asyncHandler(this.transformInterceptor(patchPost))
    );
    this.router.get(
      '/:postId',
      throttler,
      authOptionGuard,
      userActivePipe,
      postIdPipe('postId', 'params'),
      asyncHandler(this.transformInterceptor(getPostDetail))
    );
    this.router.get(
      '/:type/:postId',
      throttler,
      authOptionGuard,
      userActivePipe,
      postIdPipe('postId', 'params'),
      postTypePipe,
      validateCursorPaginationQuery,
      asyncHandler(this.transformInterceptor(getPostsType))
    );
    this.router.post(
      '/',
      throttler,
      authGuard,
      userActivePipe,
      createPostPipe,
      asyncHandler(this.transformInterceptor(createPost))
    );
  }
}
