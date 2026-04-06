import { protect } from '@/modules/auth/auth.middleware';
import { BaseRoute } from '@/modules/base/base.route';
import { NotificationsController } from '@/modules/notifications/notifications.controller';
import { NotificationsValidation } from '@/modules/notifications/notifications.validation';
import { UsersValidation } from '@/modules/users/users.validation';
import { validateCursorPaginationQuery } from '@/shared/middlewares/common.middleware';
import { appLimiter } from '@/shared/middlewares/limiter.middleware';
import { asyncHandler } from '@/utils/handler.util';

class NotificationsRoute extends BaseRoute {
  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    const { list, markRead, markOneRead } = this.container.get(NotificationsController);
    const { userVerifiedValidation } = this.container.get(UsersValidation);
    const { listQuery, markReadBody, notificationIdParam } = this.container.get(NotificationsValidation);

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

export function notificationsRouter() {
  return new NotificationsRoute().getRouter();
}
