import { AuthGuard } from '@/presentation/http/express/middlewares/auth.guard';
import { validateCursorPaginationQuery } from '@/presentation/http/express/middlewares/common.middleware';
import { postsLimiter } from '@/presentation/http/express/middlewares/limiter.middleware';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IPostController } from '@/presentation/http/express/v1/controllers/post.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { IPostValidator } from '@/presentation/http/express/v1/validators/post.validator';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export class PostRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'posts';

  constructor(
    private readonly postController: IPostController,
    private readonly postValidator: IPostValidator,
    private readonly userValidator: IUserValidator,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { getNewFeeds, patchPost, getPostDetail, getPostsType, createPost } = this.postController;
    const { postIdValidator, patchPostValidator, postTypeValidator, createPostValidator } = this.postValidator;
    const { userActiveValidator } = this.userValidator;
    const { protect, optionalAuth } = this.authGuard;

    this.router.get(
      '/',
      postsLimiter,
      optionalAuth(userActiveValidator),
      validateCursorPaginationQuery,
      asyncHandler(getNewFeeds)
    );
    this.router.patch(
      '/:postId',
      postsLimiter,
      protect,
      userActiveValidator,
      postIdValidator('postId', 'params'),
      patchPostValidator,
      asyncHandler(patchPost)
    );
    this.router.get(
      '/:postId',
      postsLimiter,
      optionalAuth(userActiveValidator),
      postIdValidator('postId', 'params'),
      asyncHandler(getPostDetail)
    );
    this.router.get(
      '/:type/:postId',
      postsLimiter,
      optionalAuth(userActiveValidator),
      postIdValidator('postId', 'params'),
      postTypeValidator,
      validateCursorPaginationQuery,
      asyncHandler(getPostsType)
    );
    this.router.post('/', postsLimiter, protect, userActiveValidator, createPostValidator, asyncHandler(createPost));
  }
}
