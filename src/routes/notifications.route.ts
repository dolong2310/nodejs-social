/*
 * In-app notifications inbox (Phase 5) — social DB, list + mark read.
 */

import { INotificationsController } from '@/controllers/notifications.controller';
import { protect } from '@/middlewares/auth.middleware';
import { appLimiter } from '@/middlewares/limiter.middleware';
import { BaseRoute } from '@/routes/base.route';
import { asyncHandler } from '@/utils/handler.util';
import { INotificationsValidation } from '@/validations/notifications.validation';
import { IUsersValidation } from '@/validations/users.validation';

export class NotificationsRoute extends BaseRoute {
  private notificationsController!: INotificationsController;
  private usersValidation!: IUsersValidation;
  private notificationsValidation!: INotificationsValidation;

  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    this.notificationsController = this.container.getNotificationsController();
    this.usersValidation = this.container.getUsersValidation();
    this.notificationsValidation = this.container.getNotificationsValidation();

    const v = this.usersValidation.userVerifiedValidation;
    const nv = this.notificationsValidation;

    this.router.get('/', appLimiter, protect, v, nv.listQuery, asyncHandler(this.notificationsController.list));

    this.router.patch(
      '/read',
      appLimiter,
      protect,
      v,
      nv.markReadBody,
      asyncHandler(this.notificationsController.markRead)
    );

    this.router.patch(
      '/:notificationId/read',
      appLimiter,
      protect,
      v,
      nv.notificationIdParam,
      asyncHandler(this.notificationsController.markOneRead)
    );
  }
}

export default () => {
  const r = new NotificationsRoute();
  return r.getRouter();
};
