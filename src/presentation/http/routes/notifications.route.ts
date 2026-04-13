import { INotificationsController } from '@/presentation/http/controllers/notifications.controller';
import { protect } from '@/presentation/http/middlewares/auth.middleware';
import { validateCursorPaginationQuery } from '@/presentation/http/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { INotificationsValidation } from '@/presentation/http/validators/notifications.validator';
import { IUsersValidation } from '@/presentation/http/validators/users.validator';

export class NotificationsRoute extends BaseRoute {
  constructor(
    private readonly notificationsController: INotificationsController,
    private readonly notificationsValidation: INotificationsValidation,
    private readonly usersValidation: IUsersValidation
  ) {
    super('/notifications');
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    const { list, markRead, markOneRead } = this.notificationsController;
    const { userVerifiedValidation } = this.usersValidation;
    const { listQuery, markReadBody, notificationIdParam } = this.notificationsValidation;

    this.router.get(
      '/',
      appLimiter,
      protect,
      userVerifiedValidation,
      validateCursorPaginationQuery,
      listQuery,
      asyncHandler(list)
    );

    this.router.patch('/read', appLimiter, protect, userVerifiedValidation, markReadBody, asyncHandler(markRead));

    this.router.patch(
      '/:notificationId/read',
      appLimiter,
      protect,
      userVerifiedValidation,
      notificationIdParam,
      asyncHandler(markOneRead)
    );
  }
}
