import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { ILikeController } from '@/presentation/http/express/v1/controllers/like.controller';
import { IPostPipe } from '@/presentation/http/express/v1/pipes/post.pipe';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';

export class LikeRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'likes';

  constructor(
    private readonly likeController: ILikeController,
    private readonly userPipe: IUserPipe,
    private readonly postPipe: IPostPipe,
    private readonly authGuard: AuthGuard,
    private readonly throttlerGuard: ThrottlerProxyGuard,
    private readonly loggingInterceptor: LoggingInterceptor,
    private readonly transformResponseInterceptor: TransformResponseInterceptor,
    private readonly timeoutInterceptor: TimeoutInterceptor
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const throttler = this.throttlerGuard.handler();

    this.router.post(
      '/',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.postPipe.postIdPipe('postId', 'body')],
        controller: this.likeController.createLike
      })
    );
    this.router.delete(
      '/posts/:postId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.postPipe.postIdPipe('postId', 'params')],
        controller: this.likeController.deleteLike
      })
    );

    // this.router.post(
    //   '/',
    //   throttler,
    //   authGuard,
    //   userActivePipe,
    //   postIdPipe('postId', 'body'),
    //   this.interceptor(createLike)
    // );
    // this.router.delete(
    //   '/posts/:postId',
    //   throttler,
    //   authGuard,
    //   userActivePipe,
    //   postIdPipe('postId', 'params'),
    //   this.interceptor(deleteLike)
    // );
  }
}
