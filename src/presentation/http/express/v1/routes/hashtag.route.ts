import { HASHTAG_THROTTLE_CONFIG } from '@/presentation/http/express/constants/throttler/hashtag.throttler.constants';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import type { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import type { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import type { CacheInterceptor } from '@/presentation/http/express/interceptors/cache.interceptor';
import type { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import type { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import type { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import type { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import type { IHashtagController } from '@/presentation/http/express/v1/controllers/hashtag.controller';
import { validate } from '@/presentation/http/express/pipes/validation.pipe';
import {
  paginatedSchema,
  PaginationQuerySchema
} from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import {
  CreateHashtagBodySchema,
  HashtagIdParamsSchema,
  UpdateHashtagBodySchema
} from '@/presentation/http/express/v1/schemas/hashtag/hashtag.request.schema';
import { HashtagResponseSchema } from '@/presentation/http/express/v1/schemas/hashtag/hashtag.response.schema';

export class HashtagRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'hashtags';

  constructor(
    private readonly hashtagController: IHashtagController,
    private readonly authGuard: AuthGuard,
    private readonly throttlerGuard: ThrottlerProxyGuard,
    private readonly loggingInterceptor: LoggingInterceptor,
    private readonly transformResponseInterceptor: TransformResponseInterceptor,
    private readonly timeoutInterceptor: TimeoutInterceptor,
    private readonly cacheInterceptor: CacheInterceptor,
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
        middlewares: [this.throttlerGuard.handler(HASHTAG_THROTTLE_CONFIG.LIST)],
        guards: [this.authGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.cacheInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ query: PaginationQuerySchema })],
        response: paginatedSchema(HashtagResponseSchema),
        controller: this.hashtagController.list
      },
      {
        path: '/',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(HASHTAG_THROTTLE_CONFIG.CREATE)],
        guards: [this.authGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ body: CreateHashtagBodySchema })],
        response: HashtagResponseSchema,
        controller: this.hashtagController.create
      },
      {
        path: '/:hashtagId',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(HASHTAG_THROTTLE_CONFIG.GET_BY_ID)],
        guards: [this.authGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.cacheInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: HashtagIdParamsSchema })],
        response: HashtagResponseSchema,
        controller: this.hashtagController.getById
      },
      {
        path: '/:hashtagId',
        method: 'put',
        middlewares: [this.throttlerGuard.handler(HASHTAG_THROTTLE_CONFIG.UPDATE)],
        guards: [this.authGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: HashtagIdParamsSchema, body: UpdateHashtagBodySchema })],
        response: HashtagResponseSchema,
        controller: this.hashtagController.update
      },
      {
        path: '/:hashtagId',
        method: 'delete',
        middlewares: [this.throttlerGuard.handler(HASHTAG_THROTTLE_CONFIG.REMOVE)],
        guards: [this.authGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: HashtagIdParamsSchema })],
        controller: this.hashtagController.remove
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
