import type { ListNotificationsPort } from '@/modules/notification/application/use-cases/list-notifications/list-notifications.port';
import type { MarkNotificationReadPort } from '@/modules/notification/application/use-cases/mark-notification-read/mark-notification-read.port';
import type { MarkNotificationsReadPort } from '@/modules/notification/application/use-cases/mark-notifications-read/mark-notifications-read.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import type { ValidatedRequest } from '@/presentation/http/express/types';
import type {
  MarkNotificationsReadBodySchema,
  NotificationIdParamsSchema,
  NotificationListQuerySchema
} from '@/presentation/http/express/v1/schemas/notification/notification.request.schema';
import type { NotificationResponse } from '@/presentation/http/express/v1/schemas/notification/notification.response.schema';

type ListNotificationsRequest = ValidatedRequest<{ query: typeof NotificationListQuerySchema }>;
type MarkReadRequest = ValidatedRequest<{ body: typeof MarkNotificationsReadBodySchema }>;
type MarkOneReadRequest = ValidatedRequest<{ params: typeof NotificationIdParamsSchema }>;

export interface INotificationController {
  list(req: ListNotificationsRequest): Promise<unknown>;
  markRead(req: MarkReadRequest): Promise<unknown>;
  markOneRead(req: MarkOneReadRequest): Promise<unknown>;
}

@AutoBind()
export class NotificationsController extends BaseController implements INotificationController {
  constructor(
    private readonly listNotificationsUC: ListNotificationsPort,
    private readonly markNotificationsReadUC: MarkNotificationsReadPort,
    private readonly markNotificationReadUC: MarkNotificationReadPort
  ) {
    super();
  }

  async list(req: ListNotificationsRequest) {
    const userId = this.getUserId(req);
    const { limit, cursor, unreadOnly } = req.query;

    const { items, nextCursor } = await this.listNotificationsUC.execute({
      viewerId: userId,
      limit,
      cursor,
      unreadOnly
    });

    return this.cursorPaginatedResponse<NotificationResponse>({
      items,
      nextCursor,
      message: 'Notifications loaded'
    });
  }

  async markRead(req: MarkReadRequest) {
    const userId = this.getUserId(req);
    const body = req.body;
    const ids = body.ids && body.ids.length > 0 ? body.ids : undefined;

    await this.markNotificationsReadUC.execute({ viewerId: userId, ids });

    return this.response({ message: 'Notifications updated' });
  }

  async markOneRead(req: MarkOneReadRequest) {
    const userId = this.getUserId(req);
    const { notificationId } = req.params;

    await this.markNotificationReadUC.execute({ viewerId: userId, notificationId });

    return this.response({ message: 'Notification marked read' });
  }
}
