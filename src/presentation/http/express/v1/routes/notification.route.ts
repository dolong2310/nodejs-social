import { AuthGuard } from '@/presentation/http/express/middlewares/auth.guard';
import { validateCursorPaginationQuery } from '@/presentation/http/express/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/express/middlewares/limiter.middleware';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { INotificationController } from '@/presentation/http/express/v1/controllers/notifications.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { INotificationValidator } from '@/presentation/http/express/v1/validators/notification.validator';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export class NotificationRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'notifications';

  constructor(
    private readonly notificationController: INotificationController,
    private readonly notificationValidator: INotificationValidator,
    private readonly userValidator: IUserValidator,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { list, markRead, markOneRead } = this.notificationController;
    const { userActiveValidator } = this.userValidator;
    const { listQuery, markReadBody, notificationIdParam } = this.notificationValidator;
    const { protect } = this.authGuard;

    this.router.get(
      '/',
      appLimiter,
      protect,
      userActiveValidator,
      validateCursorPaginationQuery,
      listQuery,
      asyncHandler(list)
    );

    this.router.patch('/read', appLimiter, protect, userActiveValidator, markReadBody, asyncHandler(markRead));

    this.router.patch(
      '/:notificationId/read',
      appLimiter,
      protect,
      userActiveValidator,
      notificationIdParam,
      asyncHandler(markOneRead)
    );
  }
}
