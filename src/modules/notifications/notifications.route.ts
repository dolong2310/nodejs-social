/*
 * social DB, list + mark read.
 */

import { BaseRoute, NotificationsController, NotificationsValidation, UsersValidation, protect } from '@/modules';
import { appLimiter, validateCursorPaginationQuery } from '@/shared';
import { asyncHandler } from '@/utils';

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
