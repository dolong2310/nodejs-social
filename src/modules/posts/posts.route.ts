/*
 * This file defines the posts routes for getting new feeds, getting post detail, getting posts type, and creating post.
 */

import { optionalAuth, protect } from '@/modules/auth/auth.middleware';
import { BaseRoute } from '@/modules/base/base.route';
import { PostsController } from '@/modules/posts/posts.controller';
import { PostsValidation } from '@/modules/posts/posts.validation';
import { UsersValidation } from '@/modules/users/users.validation';
import { validateCursorPaginationQuery } from '@/shared/middlewares/common.middleware';
import { postsLimiter } from '@/shared/middlewares/limiter.middleware';
import { asyncHandler } from '@/utils/handler.util';

class PostsRoute extends BaseRoute {
  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    const { getNewFeeds, patchPost, getPostDetail, getPostsType, createPost } = this.container.get(PostsController);
    const { postIdValidation, patchPostValidation, audienceValidation, postTypeValidation, createPostValidation } =
      this.container.get(PostsValidation);
    const { attachAuthenticatedUserAllowUnverified, userVerifiedValidation } = this.container.get(UsersValidation);

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

export function postsRouter() {
  return new PostsRoute().getRouter();
}
