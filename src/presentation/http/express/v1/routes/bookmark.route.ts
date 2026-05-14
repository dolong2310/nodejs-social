import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IBookmarkController } from '@/presentation/http/express/v1/controllers/bookmark.controller';
import { IPostPipe } from '@/presentation/http/express/v1/pipes/post.pipe';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';

export class BookmarkRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'bookmarks';

  constructor(
    private readonly bookmarkController: IBookmarkController,
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
        controller: this.bookmarkController.createBookmark
      })
    );
    this.router.delete(
      '/posts/:postId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.postPipe.postIdPipe('postId', 'params')],
        controller: this.bookmarkController.deleteBookmark
      })
    );
  }
}
