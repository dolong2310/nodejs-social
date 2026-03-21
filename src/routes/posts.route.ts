/*
 * This file defines the posts routes for getting new feeds, getting post detail, getting posts type, and creating post.
 */

import { IPostsController } from '@/controllers/posts.controller';
import { optionalAuth, protect } from '@/middlewares/auth.middleware';
import { validatePaginationQuery } from '@/middlewares/common.middleware';
import { postsLimiter } from '@/middlewares/limiter.middleware';
import { BaseRoute } from '@/routes/base.route';
import { asyncHandler } from '@/utils/handler.util';
import { IPostsValidation } from '@/validations/posts.validation';
import { IUsersValidation } from '@/validations/users.validation';

export class PostsRoute extends BaseRoute {
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

export default () => {
  const postsRoute = new PostsRoute();
  return postsRoute.getRouter();
};
