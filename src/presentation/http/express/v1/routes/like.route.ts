import { AuthGuard } from '@/presentation/http/express/middlewares/auth.guard';
import { appLimiter } from '@/presentation/http/express/middlewares/limiter.middleware';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { ILikeController } from '@/presentation/http/express/v1/controllers/like.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { IPostValidator } from '@/presentation/http/express/v1/validators/post.validator';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export class LikeRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'likes';

  constructor(
    private readonly likeController: ILikeController,
    private readonly userValidator: IUserValidator,
    private readonly postValidator: IPostValidator,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { createLike, deleteLike } = this.likeController;
    const { userActiveValidator } = this.userValidator;
    const { postIdValidator } = this.postValidator;
    const { protect } = this.authGuard;

    this.router.post(
      '/',
      appLimiter,
      protect,
      userActiveValidator,
      postIdValidator('postId', 'body'),
      asyncHandler(createLike)
    );
    this.router.delete(
      '/posts/:postId',
      appLimiter,
      protect,
      userActiveValidator,
      postIdValidator('postId', 'params'),
      asyncHandler(deleteLike)
    );
  }
}
