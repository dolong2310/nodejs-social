import { IPostsController } from '@/presentation/http/controllers/posts.controller';
import { optionalAuth, protect } from '@/presentation/http/middlewares/auth.middleware';
import { validateCursorPaginationQuery } from '@/presentation/http/middlewares/common.middleware';
import { postsLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IPostsValidation } from '@/presentation/http/validators/posts.validator';
import { IUsersValidation } from '@/presentation/http/validators/users.validator';

export class PostsRoute extends BaseRoute {
  constructor(
    private readonly postsController: IPostsController,
    private readonly postsValidation: IPostsValidation,
    private readonly usersValidation: IUsersValidation
  ) {
    super('/posts');
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    const { getNewFeeds, patchPost, getPostDetail, getPostsType, createPost } = this.postsController;
    const { postIdValidation, patchPostValidation, audienceValidation, postTypeValidation, createPostValidation } =
      this.postsValidation;
    const { attachAuthenticatedUserAllowUnverified, userVerifiedValidation } = this.usersValidation;

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
      userVerifiedValidation,
      postIdValidation('postId', 'params'),
      patchPostValidation,
      asyncHandler(patchPost)
    );
    this.router.get(
      '/:postId',
      postsLimiter,
      optionalAuth(userVerifiedValidation),
      postIdValidation('postId', 'params'),
      audienceValidation,
      asyncHandler(getPostDetail)
    );
    this.router.get(
      '/:type/:postId',
      postsLimiter,
      optionalAuth(attachAuthenticatedUserAllowUnverified),
      postIdValidation('postId', 'params'),
      audienceValidation,
      postTypeValidation,
      validateCursorPaginationQuery,
      asyncHandler(getPostsType)
    );
    this.router.post(
      '/',
      postsLimiter,
      protect,
      userVerifiedValidation,
      createPostValidation,
      asyncHandler(createPost)
    );
  }
}
