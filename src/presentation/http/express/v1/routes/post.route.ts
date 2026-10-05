import { POST_THROTTLE_CONFIG } from '@/presentation/http/express/constants/throttler/post.throttler.constants';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import type { ActiveUserGuard } from '@/presentation/http/express/guards/active-user.guard';
import type { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import type { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import type { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import type { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import type { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import type { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import type { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import type { IPostController } from '@/presentation/http/express/v1/controllers/post.controller';
import { validate } from '@/presentation/http/express/pipes/validation.pipe';
import {
  cursorPaginatedSchema,
  CursorPaginationQuerySchema
} from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import {
  CreatePostBodySchema,
  NewFeedsQuerySchema,
  PatchPostBodySchema,
  PostIdBodySchema,
  PostIdParamsSchema,
  PostsByUserParamsSchema,
  PostsByUserQuerySchema,
  PostsTypeParamsSchema
} from '@/presentation/http/express/v1/schemas/post/post.request.schema';
import {
  PostDetailWithAuthorResponseSchema,
  PostInteractionResponseSchema,
  PostResponseSchema
} from '@/presentation/http/express/v1/schemas/post/post.response.schema';

export class PostRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'posts';

  constructor(
    private readonly postController: IPostController,
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
    const configs: RouterConfig[] = [
      {
        path: '/',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(POST_THROTTLE_CONFIG.GET_NEW_FEEDS)],
        guards: [this.authOptionGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ query: NewFeedsQuerySchema })],
        response: cursorPaginatedSchema(PostDetailWithAuthorResponseSchema),
        controller: this.postController.getNewFeeds
      },
      {
        path: '/users/:userId',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(POST_THROTTLE_CONFIG.GET_BY_USER)],
        guards: [this.authOptionGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ params: PostsByUserParamsSchema, query: PostsByUserQuerySchema })],
        response: cursorPaginatedSchema(PostDetailWithAuthorResponseSchema),
        controller: this.postController.getPostsByUser
      },
      {
        path: '/:postId',
        method: 'patch',
        middlewares: [this.throttlerGuard.handler(POST_THROTTLE_CONFIG.PATCH)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: PostIdParamsSchema, body: PatchPostBodySchema })],
        response: PostResponseSchema,
        controller: this.postController.patchPost
      },
      {
        path: '/:postId',
        method: 'delete',
        middlewares: [this.throttlerGuard.handler(POST_THROTTLE_CONFIG.DELETE)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: PostIdParamsSchema })],
        controller: this.postController.deletePost
      },
      {
        path: '/:postId',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(POST_THROTTLE_CONFIG.GET_DETAIL)],
        guards: [this.authOptionGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ params: PostIdParamsSchema })],
        response: PostDetailWithAuthorResponseSchema,
        controller: this.postController.getPostDetail
      },
      {
        path: '/me/likes',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(POST_THROTTLE_CONFIG.GET_LIKED)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ query: CursorPaginationQuerySchema })],
        response: cursorPaginatedSchema(PostDetailWithAuthorResponseSchema),
        controller: this.postController.getUserLikedPosts
      },
      {
        path: '/me/bookmarks',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(POST_THROTTLE_CONFIG.GET_BOOKMARKED)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ query: CursorPaginationQuerySchema })],
        response: cursorPaginatedSchema(PostDetailWithAuthorResponseSchema),
        controller: this.postController.getUserBookmarkedPosts
      },
      {
        path: '/:type/:postId',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(POST_THROTTLE_CONFIG.GET_BY_TYPE)],
        guards: [this.authOptionGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ params: PostsTypeParamsSchema, query: CursorPaginationQuerySchema })],
        response: cursorPaginatedSchema(PostDetailWithAuthorResponseSchema),
        controller: this.postController.getPostsType
      },
      {
        path: '/',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(POST_THROTTLE_CONFIG.CREATE)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ body: CreatePostBodySchema })],
        response: PostResponseSchema,
        controller: this.postController.createPost
      },
      {
        path: '/bookmarks',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(POST_THROTTLE_CONFIG.CREATE_BOOKMARK)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ body: PostIdBodySchema })],
        response: PostInteractionResponseSchema,
        controller: this.postController.createBookmark
      },
      {
        path: '/bookmarks/:postId',
        method: 'delete',
        middlewares: [this.throttlerGuard.handler(POST_THROTTLE_CONFIG.DELETE_BOOKMARK)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: PostIdParamsSchema })],
        controller: this.postController.deleteBookmark
      },
      {
        path: '/likes',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(POST_THROTTLE_CONFIG.CREATE_LIKE)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ body: PostIdBodySchema })],
        response: PostInteractionResponseSchema,
        controller: this.postController.createLike
      },
      {
        path: '/likes/:postId',
        method: 'delete',
        middlewares: [this.throttlerGuard.handler(POST_THROTTLE_CONFIG.DELETE_LIKE)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: PostIdParamsSchema })],
        response: PostInteractionResponseSchema,
        controller: this.postController.deleteLike
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
