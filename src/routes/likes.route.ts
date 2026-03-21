/*
 * Likes routes — same engagement gates as bookmarks (verified + visibility + block).
 */

import { ILikesController } from '@/controllers/likes.controller';
import { protect } from '@/middlewares/auth.middleware';
import { appLimiter } from '@/middlewares/limiter.middleware';
import { BaseRoute } from '@/routes/base.route';
import { asyncHandler } from '@/utils/handler.util';
import { IPostsValidation } from '@/validations/posts.validation';
import { IUsersValidation } from '@/validations/users.validation';

export class LikesRoute extends BaseRoute {
  private likesController!: ILikesController;
  private usersValidation!: IUsersValidation;
  private postsValidation!: IPostsValidation;

  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    this.likesController = this.container.getLikesController();
    this.usersValidation = this.container.getUsersValidation();
    this.postsValidation = this.container.getPostsValidation();

    this.router.post(
      '/',
      appLimiter,
      protect,
      this.usersValidation.attachAuthenticatedUserAllowUnverified,
      this.usersValidation.forbidUnverifiedEngagement,
      this.postsValidation.postIdValidation('postId', 'body'),
      this.postsValidation.audienceValidation,
      asyncHandler(this.likesController.createLike)
    );
    this.router.delete(
      '/posts/:postId',
      appLimiter,
      protect,
      this.usersValidation.attachAuthenticatedUserAllowUnverified,
      this.usersValidation.forbidUnverifiedEngagement,
      this.postsValidation.postIdValidation('postId', 'params'),
      this.postsValidation.audienceValidation,
      asyncHandler(this.likesController.deleteLike)
    );
  }
}

export default () => {
  const likesRoute = new LikesRoute();
  return likesRoute.getRouter();
};
