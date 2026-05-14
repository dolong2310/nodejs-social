import { THROTTLE } from '@/presentation/http/express/constants/throttler.constant';
import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IPostController } from '@/presentation/http/express/v1/controllers/post.controller';
import { validateCursorPaginationQuery } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { IPostPipe } from '@/presentation/http/express/v1/pipes/post.pipe';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';

export class PostRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'posts';

  constructor(
    private readonly postController: IPostController,
    private readonly postPipe: IPostPipe,
    private readonly userPipe: IUserPipe,
    private readonly authGuard: AuthGuard,
    private readonly authOptionGuard: AuthOptionGuard,
    private readonly throttlerGuard: ThrottlerProxyGuard,
    private readonly loggingInterceptor: LoggingInterceptor,
    private readonly transformResponseInterceptor: TransformResponseInterceptor,
    private readonly timeoutInterceptor: TimeoutInterceptor
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const defaultThrottler = this.throttlerGuard.handler();
    const throttler = this.throttlerGuard.handler(THROTTLE.POSTS.WINDOW_MS, THROTTLE.POSTS.MAX);

    this.router.get(
      '/',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authOptionGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validateCursorPaginationQuery, this.userPipe.userActivePipe],
        controller: this.postController.getNewFeeds
      })
    );
    this.router.patch(
      '/:postId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [
          this.userPipe.userActivePipe,
          this.postPipe.postIdPipe('postId', 'params'),
          this.postPipe.patchPostPipe
        ],
        controller: this.postController.patchPost
      })
    );
    this.router.get(
      '/:postId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authOptionGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.postPipe.postIdPipe('postId', 'params')],
        controller: this.postController.getPostDetail
      })
    );
    this.router.get(
      '/:type/:postId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authOptionGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [
          validateCursorPaginationQuery,
          this.userPipe.userActivePipe,
          this.postPipe.postIdPipe('postId', 'params'),
          this.postPipe.postTypePipe
        ],
        controller: this.postController.getPostsType
      })
    );
    this.router.post(
      '/',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.postPipe.createPostPipe],
        controller: this.postController.createPost
      })
    );
    this.router.post(
      '/bookmarks',
      this.createRouteHandler({
        middlewares: [defaultThrottler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.postPipe.postIdPipe('postId', 'body')],
        controller: this.postController.createBookmark
      })
    );
    this.router.delete(
      '/bookmarks/:postId',
      this.createRouteHandler({
        middlewares: [defaultThrottler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.postPipe.postIdPipe('postId', 'params')],
        controller: this.postController.deleteBookmark
      })
    );
    this.router.post(
      '/likes',
      this.createRouteHandler({
        middlewares: [defaultThrottler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.postPipe.postIdPipe('postId', 'body')],
        controller: this.postController.createLike
      })
    );
    this.router.delete(
      '/likes/:postId',
      this.createRouteHandler({
        middlewares: [defaultThrottler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.postPipe.postIdPipe('postId', 'params')],
        controller: this.postController.deleteLike
      })
    );
  }
}
