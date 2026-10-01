import { HASHTAG_THROTTLE_CONFIG } from '@/presentation/http/express/constants/throttler/hashtag.throttler.constants';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { CacheInterceptor } from '@/presentation/http/express/interceptors/cache.interceptor';
import { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IHashtagController } from '@/presentation/http/express/v1/controllers/hashtag.controller';
import { IHashtagsPipe } from '@/presentation/http/express/v1/pipes/hashtag.pipe';
import { IPaginationPipe } from '@/presentation/http/express/v1/pipes/pagination.pipe';

export class HashtagRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'hashtags';

  constructor(
    private readonly hashtagController: IHashtagController,
    private readonly hashtagsPipe: IHashtagsPipe,
    private readonly paginationPipe: IPaginationPipe,
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
        pipes: [this.paginationPipe.paginationQuery],
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
        pipes: [this.hashtagsPipe.createBodyPipe],
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
        pipes: [this.hashtagsPipe.hashtagIdParam],
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
        pipes: [this.hashtagsPipe.hashtagIdParam, this.hashtagsPipe.updateBodyPipe],
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
        pipes: [this.hashtagsPipe.hashtagIdParam],
        controller: this.hashtagController.remove
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
