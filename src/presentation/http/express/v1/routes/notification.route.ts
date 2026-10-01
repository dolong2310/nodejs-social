import { NOTIFICATION_THROTTLE_CONFIG } from '@/presentation/http/express/constants/throttler/notification.throttler.constants';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import { ActiveUserGuard } from '@/presentation/http/express/guards/active-user.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { INotificationController } from '@/presentation/http/express/v1/controllers/notifications.controller';
import { INotificationPipe } from '@/presentation/http/express/v1/pipes/notification.pipe';
import { IPaginationPipe } from '@/presentation/http/express/v1/pipes/pagination.pipe';

export class NotificationRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'notifications';

  constructor(
    private readonly notificationController: INotificationController,
    private readonly notificationPipe: INotificationPipe,
    private readonly paginationPipe: IPaginationPipe,
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
        pipes: [this.paginationPipe.cursorPaginationQuery, this.notificationPipe.listQuery],
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
        pipes: [this.notificationPipe.markReadBody],
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
        pipes: [this.notificationPipe.notificationIdParam],
        controller: this.notificationController.markOneRead
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
