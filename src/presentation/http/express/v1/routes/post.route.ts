import { THROTTLE } from '@/presentation/http/express/constants/throttler.constant';
import { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IPostController } from '@/presentation/http/express/v1/controllers/post.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { validateCursorPaginationQuery } from '@/presentation/http/express/v1/validators/pagination.validator';
import { IPostValidator } from '@/presentation/http/express/v1/validators/post.validator';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export class PostRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'posts';

  constructor(
    private readonly postController: IPostController,
    private readonly postValidator: IPostValidator,
    private readonly userValidator: IUserValidator,
    private readonly authGuard: AuthGuard,
    private readonly authOptionGuard: AuthOptionGuard,
    private readonly throttler: ThrottlerProxyGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { getNewFeeds, patchPost, getPostDetail, getPostsType, createPost } = this.postController;
    const { postIdValidator, patchPostValidator, postTypeValidator, createPostValidator } = this.postValidator;
    const { userActiveValidator } = this.userValidator;
    const authGuard = this.authGuard.handler;
    const authOptionGuard = this.authOptionGuard.handler;
    const throttler = this.throttler.handler(THROTTLE.POSTS.WINDOW_MS, THROTTLE.POSTS.MAX);

    this.router.get(
      '/',
      throttler,
      authOptionGuard,
      userActiveValidator,
      validateCursorPaginationQuery,
      asyncHandler(getNewFeeds)
    );
    this.router.patch(
      '/:postId',
      throttler,
      authGuard,
      userActiveValidator,
      postIdValidator('postId', 'params'),
      patchPostValidator,
      asyncHandler(patchPost)
    );
    this.router.get(
      '/:postId',
      throttler,
      authOptionGuard,
      userActiveValidator,
      postIdValidator('postId', 'params'),
      asyncHandler(getPostDetail)
    );
    this.router.get(
      '/:type/:postId',
      throttler,
      authOptionGuard,
      userActiveValidator,
      postIdValidator('postId', 'params'),
      postTypeValidator,
      validateCursorPaginationQuery,
      asyncHandler(getPostsType)
    );
    this.router.post('/', throttler, authGuard, userActiveValidator, createPostValidator, asyncHandler(createPost));
  }
}
