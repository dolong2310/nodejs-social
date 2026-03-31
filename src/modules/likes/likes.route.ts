/*
 * Likes routes — same engagement gates as bookmarks (verified + visibility + block).
 */

import { BaseRoute, LikesController, PostsValidation, UsersValidation, protect } from '@/modules';
import { appLimiter } from '@/shared';
import { asyncHandler } from '@/utils';

export class LikesRoute extends BaseRoute {
  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    const { createLike, deleteLike } = this.container.get(LikesController);
    const { attachAuthenticatedUserAllowUnverified, forbidUnverifiedEngagement } = this.container.get(UsersValidation);
    const { postIdValidation, audienceValidation } = this.container.get(PostsValidation);

    this.router.post(
      '/',
      appLimiter,
      protect,
      attachAuthenticatedUserAllowUnverified,
      forbidUnverifiedEngagement,
      postIdValidation('postId', 'body'),
      audienceValidation,
      asyncHandler(createLike)
    );
    this.router.delete(
      '/posts/:postId',
      appLimiter,
      protect,
      attachAuthenticatedUserAllowUnverified,
      forbidUnverifiedEngagement,
      postIdValidation('postId', 'params'),
      audienceValidation,
      asyncHandler(deleteLike)
    );
  }
}

export function likesRouter() {
  return new LikesRoute().getRouter();
}
