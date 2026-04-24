import { INotificationController } from '@/presentation/http/controllers/notifications.controller';
import { protect } from '@/presentation/http/middlewares/auth.middleware';
import { validateCursorPaginationQuery } from '@/presentation/http/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { INotificationValidator } from '@/presentation/http/validators/notification.validator';
import { IUserValidator } from '@/presentation/http/validators/user.validator';

export class NotificationRoute extends BaseRoute {
  protected override readonly pathName = '/notifications';

  constructor(
    private readonly notificationController: INotificationController,
    private readonly notificationValidator: INotificationValidator,
    private readonly userValidator: IUserValidator
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { list, markRead, markOneRead } = this.notificationController;
    const { userVerifiedValidator } = this.userValidator;
    const { listQuery, markReadBody, notificationIdParam } = this.notificationValidator;

    this.router.get(
      '/',
      appLimiter,
      protect,
      userVerifiedValidator,
      validateCursorPaginationQuery,
      listQuery,
      asyncHandler(list)
    );

    this.router.patch('/read', appLimiter, protect, userVerifiedValidator, markReadBody, asyncHandler(markRead));

    this.router.patch(
      '/:notificationId/read',
      appLimiter,
      protect,
      userVerifiedValidator,
      notificationIdParam,
      asyncHandler(markOneRead)
    );
  }
}
