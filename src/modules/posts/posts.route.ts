/*
 * This file defines the posts routes for getting new feeds, getting post detail, getting posts type, and creating post.
 */

import { BaseRoute, PostsController, PostsValidation, UsersValidation, optionalAuth, protect } from '@/modules';
import { postsLimiter, validatePaginationQuery } from '@/shared';
import { asyncHandler } from '@/utils';

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
      validatePaginationQuery,
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
      validatePaginationQuery,
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
