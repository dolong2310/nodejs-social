import { IPostController } from '@/presentation/http/controllers/post.controller';
import { optionalAuth, protect } from '@/presentation/http/middlewares/auth.middleware';
import { validateCursorPaginationQuery } from '@/presentation/http/middlewares/common.middleware';
import { postsLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IPostValidator } from '@/presentation/http/validators/post.validator';
import { IUserValidator } from '@/presentation/http/validators/user.validator';

export class PostRoute extends BaseRoute {
  protected override readonly pathName = '/posts';

  constructor(
    private readonly postController: IPostController,
    private readonly postValidator: IPostValidator,
    private readonly userValidator: IUserValidator
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { getNewFeeds, patchPost, getPostDetail, getPostsType, createPost } = this.postController;
    const { postIdValidator, patchPostValidator, audienceValidator, postTypeValidator, createPostValidator } =
      this.postValidator;
    const { attachAuthenticatedUserAllowUnverified, userVerifiedValidator } = this.userValidator;

    this.router.get(
      '/',
      postsLimiter,
      optionalAuth(attachAuthenticatedUserAllowUnverified),
      validateCursorPaginationQuery,
      asyncHandler(getNewFeeds)
    );
    this.router.patch(
      '/:postId',
      postsLimiter,
      protect,
      userVerifiedValidator,
      postIdValidator('postId', 'params'),
      patchPostValidator,
      asyncHandler(patchPost)
    );
    this.router.get(
      '/:postId',
      postsLimiter,
      optionalAuth(userVerifiedValidator),
      postIdValidator('postId', 'params'),
      audienceValidator,
      asyncHandler(getPostDetail)
    );
    this.router.get(
      '/:type/:postId',
      postsLimiter,
      optionalAuth(attachAuthenticatedUserAllowUnverified),
      postIdValidator('postId', 'params'),
      audienceValidator,
      postTypeValidator,
      validateCursorPaginationQuery,
      asyncHandler(getPostsType)
    );
    this.router.post('/', postsLimiter, protect, userVerifiedValidator, createPostValidator, asyncHandler(createPost));
  }
}
