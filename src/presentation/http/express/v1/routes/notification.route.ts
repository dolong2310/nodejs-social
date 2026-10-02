import { NOTIFICATION_THROTTLE_CONFIG } from '@/presentation/http/express/constants/throttler/notification.throttler.constants';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import type { ActiveUserGuard } from '@/presentation/http/express/guards/active-user.guard';
import type { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import type { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import type { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import type { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import type { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import type { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import type { INotificationController } from '@/presentation/http/express/v1/controllers/notifications.controller';
import { validate } from '@/presentation/http/express/pipes/validation.pipe';
import { cursorPaginatedSchema } from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import {
  MarkNotificationsReadBodySchema,
  NotificationIdParamsSchema,
  NotificationListQuerySchema
} from '@/presentation/http/express/v1/schemas/notification/notification.request.schema';
import { NotificationResponseSchema } from '@/presentation/http/express/v1/schemas/notification/notification.response.schema';

export class NotificationRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'notifications';

  constructor(
    private readonly notificationController: INotificationController,
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
        middlewares: [this.throttlerGuard.handler(NOTIFICATION_THROTTLE_CONFIG.LIST)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ query: NotificationListQuerySchema })],
        response: cursorPaginatedSchema(NotificationResponseSchema),
        controller: this.notificationController.list
      },
      {
        path: '/read',
        method: 'patch',
        middlewares: [this.throttlerGuard.handler(NOTIFICATION_THROTTLE_CONFIG.MARK_READ)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ body: MarkNotificationsReadBodySchema })],
        controller: this.notificationController.markRead
      },
      {
        path: '/:notificationId/read',
        method: 'patch',
        middlewares: [this.throttlerGuard.handler(NOTIFICATION_THROTTLE_CONFIG.MARK_ONE_READ)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: NotificationIdParamsSchema })],
        controller: this.notificationController.markOneRead
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
