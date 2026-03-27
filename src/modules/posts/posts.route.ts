/*
 * This file defines the posts routes for getting new feeds, getting post detail, getting posts type, and creating post.
 */

import { BaseRoute, IPostsController, IPostsValidation, IUsersValidation, optionalAuth, protect } from '@/modules';
import { postsLimiter, validatePaginationQuery } from '@/shared';
import { asyncHandler } from '@/utils';

class PostsRoute extends BaseRoute {
  private postsController!: IPostsController;
  private postsValidation!: IPostsValidation;
  private usersValidation!: IUsersValidation;

  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    // Initialize the controller here, after the container is available
    this.postsController = this.container.getPostsController();
    this.postsValidation = this.container.getPostsValidation();
    this.usersValidation = this.container.getUsersValidation();

    this.router.get(
      '/',
      postsLimiter,
      optionalAuth(this.usersValidation.attachAuthenticatedUserAllowUnverified),
      validatePaginationQuery,
      asyncHandler(this.postsController.getNewFeeds)
    );
    this.router.patch(
      '/:postId',
      postsLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.postsValidation.postIdValidation('postId', 'params'),
      this.postsValidation.patchPostValidation,
      asyncHandler(this.postsController.patchPost)
    );
    this.router.get(
      '/:postId',
      postsLimiter,
      optionalAuth(this.usersValidation.userVerifiedValidation),
      this.postsValidation.postIdValidation('postId', 'params'),
      this.postsValidation.audienceValidation,
      asyncHandler(this.postsController.getPostDetail)
    );
    this.router.get(
      '/:type/:postId',
      postsLimiter,
      optionalAuth(this.usersValidation.attachAuthenticatedUserAllowUnverified),
      this.postsValidation.postIdValidation('postId', 'params'),
      this.postsValidation.audienceValidation,
      this.postsValidation.postTypeValidation,
      validatePaginationQuery,
      asyncHandler(this.postsController.getPostsType)
    );
    this.router.post(
      '/',
      postsLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.postsValidation.createPostValidation,
      asyncHandler(this.postsController.createPost)
    );
  }
}

export function postsRouter() {
  return new PostsRoute().getRouter();
}
