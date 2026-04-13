import { ILikesController } from '@/presentation/http/controllers/likes.controller';
import { protect } from '@/presentation/http/middlewares/auth.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { IPostsValidation } from '@/presentation/http/validators/posts.validator';
import { IUsersValidation } from '@/presentation/http/validators/users.validator';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';

export class LikesRoute extends BaseRoute {
  constructor(
    private readonly likesController: ILikesController,
    private readonly usersValidation: IUsersValidation,
    private readonly postsValidation: IPostsValidation
  ) {
    super('/likes');
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    const { createLike, deleteLike } = this.likesController;
    const { attachAuthenticatedUserAllowUnverified, forbidUnverifiedEngagement } = this.usersValidation;
    const { postIdValidation, audienceValidation } = this.postsValidation;

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
