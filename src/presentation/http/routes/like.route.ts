import { ILikeController } from '@/presentation/http/controllers/like.controller';
import { protect } from '@/presentation/http/middlewares/auth.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IPostValidator } from '@/presentation/http/validators/post.validator';
import { IUserValidator } from '@/presentation/http/validators/user.validator';

export class LikeRoute extends BaseRoute {
  protected override readonly pathName = '/likes';

  constructor(
    private readonly likeController: ILikeController,
    private readonly userValidator: IUserValidator,
    private readonly postValidator: IPostValidator
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { createLike, deleteLike } = this.likeController;
    const { attachAuthenticatedUserAllowUnverified, forbidUnverifiedEngagement } = this.userValidator;
    const { postIdValidator, audienceValidator } = this.postValidator;

    this.router.post(
      '/',
      appLimiter,
      protect,
      attachAuthenticatedUserAllowUnverified,
      forbidUnverifiedEngagement,
      postIdValidator('postId', 'body'),
      audienceValidator,
      asyncHandler(createLike)
    );
    this.router.delete(
      '/posts/:postId',
      appLimiter,
      protect,
      attachAuthenticatedUserAllowUnverified,
      forbidUnverifiedEngagement,
      postIdValidator('postId', 'params'),
      audienceValidator,
      asyncHandler(deleteLike)
    );
  }
}
