import { ADMIN_USER_THROTTLE_CONFIG } from '@/presentation/http/express/constants/throttler/admin-user.throttler.constants';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import type { ApiKeyGuard } from '@/presentation/http/express/guards/api-key.guard';
import type { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import type { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import type { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import type { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import type { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import type { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import type { IAdminUserController } from '@/presentation/http/express/v1/controllers/admin-user.controller';
import { validate } from '@/presentation/http/express/pipes/validation.pipe';
import {
  AdminCreateUserBodySchema,
  AdminUpdateUserBodySchema,
  AdminUserIdParamsSchema
} from '@/presentation/http/express/v1/schemas/admin-user/admin-user.request.schema';
import {
  paginatedSchema,
  PaginationQuerySchema
} from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import { UserResponseSchema } from '@/presentation/http/express/v1/schemas/user/user.response.schema';

export class AdminUserRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'admin/users';

  constructor(
    private readonly adminUserController: IAdminUserController,
    private readonly authGuard: AuthGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
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
        middlewares: [this.throttlerGuard.handler(ADMIN_USER_THROTTLE_CONFIG.LIST)],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ query: PaginationQuerySchema })],
        response: paginatedSchema(UserResponseSchema),
        controller: this.adminUserController.list
      },
      {
        path: '/',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(ADMIN_USER_THROTTLE_CONFIG.CREATE)],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ body: AdminCreateUserBodySchema })],
        response: UserResponseSchema,
        controller: this.adminUserController.create
      },
      {
        path: '/:userId',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(ADMIN_USER_THROTTLE_CONFIG.GET_BY_ID)],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ params: AdminUserIdParamsSchema })],
        response: UserResponseSchema,
        controller: this.adminUserController.getById
      },
      {
        path: '/:userId',
        method: 'put',
        middlewares: [this.throttlerGuard.handler(ADMIN_USER_THROTTLE_CONFIG.UPDATE)],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: AdminUserIdParamsSchema, body: AdminUpdateUserBodySchema })],
        response: UserResponseSchema,
        controller: this.adminUserController.update
      },
      {
        path: '/:userId',
        method: 'delete',
        middlewares: [this.throttlerGuard.handler(ADMIN_USER_THROTTLE_CONFIG.REMOVE)],
        guards: [this.authGuard, this.apiKeyGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: AdminUserIdParamsSchema })],
        controller: this.adminUserController.remove
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
