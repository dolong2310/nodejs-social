/*
 * Likes routes — same engagement gates as bookmarks (verified + visibility + block).
 */

import { protect } from '@/modules/auth/auth.middleware';
import { BaseRoute } from '@/modules/base/base.route';
import { LikesController } from '@/modules/likes/likes.controller';
import { PostsValidation } from '@/modules/posts/posts.validation';
import { UsersValidation } from '@/modules/users/users.validation';
import { appLimiter } from '@/shared/middlewares/limiter.middleware';
import { asyncHandler } from '@/utils/handler.util';

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
