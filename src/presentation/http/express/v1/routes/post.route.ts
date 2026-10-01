import { THROTTLE } from '@/presentation/http/express/constants/throttler.constant';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import { ActiveUserGuard } from '@/presentation/http/express/guards/active-user.guard';
import { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IPostController } from '@/presentation/http/express/v1/controllers/post.controller';
import { IPaginationPipe } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { IPostPipe } from '@/presentation/http/express/v1/pipes/post.pipe';

export class PostRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'posts';

  constructor(
    private readonly postController: IPostController,
    private readonly postPipe: IPostPipe,
    private readonly paginationPipe: IPaginationPipe,
    private readonly authGuard: AuthGuard,
    private readonly authOptionGuard: AuthOptionGuard,
    private readonly activeUserGuard: ActiveUserGuard,
    private readonly throttlerGuard: ThrottlerProxyGuard,
    private readonly loggingInterceptor: LoggingInterceptor,
    private readonly transformResponseInterceptor: TransformResponseInterceptor,
    private readonly timeoutInterceptor: TimeoutInterceptor,
    private readonly idempotencyInterceptor: IdempotencyInterceptor
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const defaultThrottler = this.throttlerGuard.handler();
    const throttler = this.throttlerGuard.handler(THROTTLE.POSTS.WINDOW_MS, THROTTLE.POSTS.MAX);

    const configs: RouterConfig[] = [
      {
        path: '/',
        method: 'get',
        middlewares: [throttler],
        guards: [this.authOptionGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.paginationPipe.cursorPaginationQuery, this.postPipe.newFeedFilterQueryPipe],
        controller: this.postController.getNewFeeds
      },
      {
        path: '/users/:userId',
        method: 'get',
        middlewares: [throttler],
        guards: [this.authOptionGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [
          this.paginationPipe.cursorPaginationQuery,
          this.postPipe.userIdPipe('userId', 'params'),
          this.postPipe.postTypeQueryPipe
        ],
        controller: this.postController.getPostsByUser
      },
      {
        path: '/:postId',
        method: 'patch',
        middlewares: [throttler],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.postPipe.postIdPipe('postId', 'params'), this.postPipe.patchPostPipe],
        controller: this.postController.patchPost
      },
      {
        path: '/:postId',
        method: 'delete',
        middlewares: [throttler],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.postPipe.postIdPipe('postId', 'params')],
        controller: this.postController.deletePost
      },
      {
        path: '/:postId',
        method: 'get',
        middlewares: [throttler],
        guards: [this.authOptionGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.postPipe.postIdPipe('postId', 'params')],
        controller: this.postController.getPostDetail
      },
      {
        path: '/me/likes',
        method: 'get',
        middlewares: [throttler],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.paginationPipe.cursorPaginationQuery],
        controller: this.postController.getUserLikedPosts
      },
      {
        path: '/me/bookmarks',
        method: 'get',
        middlewares: [throttler],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.paginationPipe.cursorPaginationQuery],
        controller: this.postController.getUserBookmarkedPosts
      },
      {
        path: '/:type/:postId',
        method: 'get',
        middlewares: [throttler],
        guards: [this.authOptionGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [
          this.paginationPipe.cursorPaginationQuery,
          this.postPipe.postIdPipe('postId', 'params'),
          this.postPipe.postTypePipe
        ],
        controller: this.postController.getPostsType
      },
      {
        path: '/',
        method: 'post',
        middlewares: [throttler],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.postPipe.createPostPipe],
        controller: this.postController.createPost
      },
      {
        path: '/bookmarks',
        method: 'post',
        middlewares: [defaultThrottler],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.postPipe.postIdPipe('postId', 'body')],
        controller: this.postController.createBookmark
      },
      {
        path: '/bookmarks/:postId',
        method: 'delete',
        middlewares: [defaultThrottler],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.postPipe.postIdPipe('postId', 'params')],
        controller: this.postController.deleteBookmark
      },
      {
        path: '/likes',
        method: 'post',
        middlewares: [defaultThrottler],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.postPipe.postIdPipe('postId', 'body')],
        controller: this.postController.createLike
      },
      {
        path: '/likes/:postId',
        method: 'delete',
        middlewares: [defaultThrottler],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.postPipe.postIdPipe('postId', 'params')],
        controller: this.postController.deleteLike
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
