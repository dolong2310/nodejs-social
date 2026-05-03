import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { INotificationController } from '@/presentation/http/express/v1/controllers/notifications.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { INotificationValidator } from '@/presentation/http/express/v1/validators/notification.validator';
import { validateCursorPaginationQuery } from '@/presentation/http/express/v1/validators/pagination.validator';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export class NotificationRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'notifications';

  constructor(
    private readonly notificationController: INotificationController,
    private readonly notificationValidator: INotificationValidator,
    private readonly userValidator: IUserValidator,
    private readonly authGuard: AuthGuard,
    private readonly throttler: ThrottlerProxyGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { list, markRead, markOneRead } = this.notificationController;
    const { userActiveValidator } = this.userValidator;
    const { listQuery, markReadBody, notificationIdParam } = this.notificationValidator;
    const authGuard = this.authGuard.handler;
    const throttler = this.throttler.handler();

    this.router.get(
      '/',
      throttler,
      authGuard,
      userActiveValidator,
      validateCursorPaginationQuery,
      listQuery,
      asyncHandler(list)
    );

    this.router.patch('/read', throttler, authGuard, userActiveValidator, markReadBody, asyncHandler(markRead));

    this.router.patch(
      '/:notificationId/read',
      throttler,
      authGuard,
      userActiveValidator,
      notificationIdParam,
      asyncHandler(markOneRead)
    );
  }
}
