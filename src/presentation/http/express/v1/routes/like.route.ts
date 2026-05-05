import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ILikeController } from '@/presentation/http/express/v1/controllers/like.controller';
import { IPostPipe } from '@/presentation/http/express/v1/pipes/post.pipe';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class LikeRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'likes';

  constructor(
    private readonly likeController: ILikeController,
    private readonly userPipe: IUserPipe,
    private readonly postPipe: IPostPipe,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { createLike, deleteLike } = this.likeController;
    const { userActivePipe } = this.userPipe;
    const { postIdPipe } = this.postPipe;
    const authGuard = this.authGuard.handler;
    const throttler = this.throttlerGuard();

    this.router.post(
      '/',
      throttler,
      authGuard,
      userActivePipe,
      postIdPipe('postId', 'body'),
      this.interceptor(createLike)
    );
    this.router.delete(
      '/posts/:postId',
      throttler,
      authGuard,
      userActivePipe,
      postIdPipe('postId', 'params'),
      this.interceptor(deleteLike)
    );
  }
}
