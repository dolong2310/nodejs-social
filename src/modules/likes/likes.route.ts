/*
 * Likes routes — same engagement gates as bookmarks (verified + visibility + block).
 */

import { BaseRoute, ILikesController, IPostsValidation, IUsersValidation, protect } from '@/modules';
import { appLimiter } from '@/shared';
import { asyncHandler } from '@/utils';

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

export function likesRouter() {
  return new LikesRoute().getRouter();
}
