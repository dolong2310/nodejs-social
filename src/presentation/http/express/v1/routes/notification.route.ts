import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { INotificationController } from '@/presentation/http/express/v1/controllers/notifications.controller';
import { INotificationPipe } from '@/presentation/http/express/v1/pipes/notification.pipe';
import { validateCursorPaginationQuery } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class NotificationRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'notifications';

  constructor(
    private readonly notificationController: INotificationController,
    private readonly notificationPipe: INotificationPipe,
    private readonly userPipe: IUserPipe,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { list, markRead, markOneRead } = this.notificationController;
    const { userActivePipe } = this.userPipe;
    const { listQuery, markReadBody, notificationIdParam } = this.notificationPipe;
    const authGuard = this.authGuard.handler;
    const throttler = this.throttlerGuard();

    this.router.get(
      '/',
      throttler,
      authGuard,
      userActivePipe,
      validateCursorPaginationQuery,
      listQuery,
      this.interceptor(list)
    );

    this.router.patch('/read', throttler, authGuard, userActivePipe, markReadBody, this.interceptor(markRead));

    this.router.patch(
      '/:notificationId/read',
      throttler,
      authGuard,
      userActivePipe,
      notificationIdParam,
      this.interceptor(markOneRead)
    );
  }
}
