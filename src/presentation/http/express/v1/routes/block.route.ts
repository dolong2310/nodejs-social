import { BLOCK_THROTTLE_CONFIG } from '@/presentation/http/express/constants/throttler/block.throttler.constants';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import type { ActiveUserGuard } from '@/presentation/http/express/guards/active-user.guard';
import type { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import type { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import type { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import type { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import type { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import type { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import type { IBlockController } from '@/presentation/http/express/v1/controllers/block.controller';
import { validate } from '@/presentation/http/express/pipes/validation.pipe';
import {
  BlockUserBodySchema,
  UnblockUserParamsSchema
} from '@/presentation/http/express/v1/schemas/block/block.request.schema';
import { BlockCreatedResponseSchema } from '@/presentation/http/express/v1/schemas/block/block.response.schema';
import {
  paginatedSchema,
  PaginationQuerySchema
} from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import { UserRecordResponseSchema } from '@/presentation/http/express/v1/schemas/friend/friend.response.schema';

export class BlockRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'blocks';

  constructor(
    private readonly blockController: IBlockController,
    private readonly authGuard: AuthGuard,
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
        middlewares: [this.throttlerGuard.handler(BLOCK_THROTTLE_CONFIG.LIST_BLOCKED)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ query: PaginationQuerySchema })],
        response: paginatedSchema(UserRecordResponseSchema),
        controller: this.blockController.listBlocked
      },
      {
        path: '/',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(BLOCK_THROTTLE_CONFIG.BLOCK_USER)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ body: BlockUserBodySchema })],
        response: BlockCreatedResponseSchema,
        controller: this.blockController.blockUser
      },
      {
        path: '/:userId',
        method: 'delete',
        middlewares: [this.throttlerGuard.handler(BLOCK_THROTTLE_CONFIG.UNBLOCK_USER)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: UnblockUserParamsSchema })],
        controller: this.blockController.unblockUser
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
