import { ROLE_THROTTLE_CONFIG } from '@/presentation/http/express/constants/throttler/role.throttler.constants';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import type { ApiKeyGuard } from '@/presentation/http/express/guards/api-key.guard';
import type { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import type { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import type { CacheInterceptor } from '@/presentation/http/express/interceptors/cache.interceptor';
import type { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import type { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import type { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import type { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import type { IRoleController } from '@/presentation/http/express/v1/controllers/role.controller';
import { validate } from '@/presentation/http/express/pipes/validation.pipe';
import {
  paginatedSchema,
  PaginationQuerySchema
} from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import {
  CreateRoleBodySchema,
  RoleIdParamsSchema,
  UpdateRoleBodySchema
} from '@/presentation/http/express/v1/schemas/role/role.request.schema';
import { RoleResponseSchema } from '@/presentation/http/express/v1/schemas/role/role.response.schema';

export class RoleRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'roles';

  constructor(
    private readonly roleController: IRoleController,
    private readonly authGuard: AuthGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
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
        middlewares: [this.throttlerGuard.handler(ROLE_THROTTLE_CONFIG.LIST)],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.cacheInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ query: PaginationQuerySchema })],
        response: paginatedSchema(RoleResponseSchema),
        controller: this.roleController.list
      },
      {
        path: '/',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(ROLE_THROTTLE_CONFIG.CREATE)],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ body: CreateRoleBodySchema })],
        response: RoleResponseSchema,
        controller: this.roleController.create
      },
      {
        path: '/:roleId',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(ROLE_THROTTLE_CONFIG.GET_BY_ID)],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.cacheInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: RoleIdParamsSchema })],
        response: RoleResponseSchema,
        controller: this.roleController.getById
      },
      {
        path: '/:roleId',
        method: 'put',
        middlewares: [this.throttlerGuard.handler(ROLE_THROTTLE_CONFIG.UPDATE)],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: RoleIdParamsSchema, body: UpdateRoleBodySchema })],
        response: RoleResponseSchema,
        controller: this.roleController.update
      },
      {
        path: '/:roleId',
        method: 'delete',
        middlewares: [this.throttlerGuard.handler(ROLE_THROTTLE_CONFIG.REMOVE)],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: RoleIdParamsSchema })],
        controller: this.roleController.remove
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
