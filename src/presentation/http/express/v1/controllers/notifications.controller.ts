import { ListNotificationsInPort } from '@/modules/notification/application/use-cases/list-notifications/list-notifications.in-port';
import { MarkNotificationReadInPort } from '@/modules/notification/application/use-cases/mark-notification-read/mark-notification-read.in-port';
import { MarkNotificationsReadInPort } from '@/modules/notification/application/use-cases/mark-notifications-read/mark-notifications-read.in-port';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
import {
  MarkNotificationsReadBodyDTO,
  NotificationIdParams,
  NotificationListQueryDTO
} from '@/presentation/http/express/v1/dtos/notification/notification.request.dto';
import { NotificationResponseDTO } from '@/presentation/http/express/v1/dtos/notification/notification.response.dto';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface INotificationController {
  list(req: Request<ParamsDictionary, object, object, NotificationListQueryDTO>): Promise<unknown>;
  markRead(req: Request<ParamsDictionary, object, MarkNotificationsReadBodyDTO>): Promise<unknown>;
  markOneRead(req: Request<NotificationIdParams>): Promise<unknown>;
}

export class NotificationsController extends BaseController implements INotificationController {
  constructor(
    private readonly listNotificationsUC: ListNotificationsInPort,
    private readonly markNotificationsReadUC: MarkNotificationsReadInPort,
    private readonly markNotificationReadUC: MarkNotificationReadInPort
  ) {
    super();
  }

  @AutoBind()
  async list(req: Request<ParamsDictionary, object, object, NotificationListQueryDTO>) {
    const userId = this.getUserId(req);
    const { limit, cursor, unreadOnly: unreadRaw } = req.query;
    const unreadOnly =
      unreadRaw === 'true' || unreadRaw === '1' ? true : unreadRaw === 'false' || unreadRaw === '0' ? false : undefined;

    const { items, nextCursor } = await this.listNotificationsUC.execute({
      viewerId: userId,
      limit: Number(limit),
      cursor,
      unreadOnly
    });

    return this.cursorPaginatedResponse<NotificationResponseDTO>({
      items,
      nextCursor,
      message: 'Notifications loaded'
    });
  }

  @AutoBind()
  async markRead(req: Request<ParamsDictionary, object, MarkNotificationsReadBodyDTO>) {
    const userId = this.getUserId(req);
    const body = new MarkNotificationsReadBodyDTO(req.body);
    const ids = body.ids && body.ids.length > 0 ? body.ids : undefined;

    await this.markNotificationsReadUC.execute({ viewerId: userId, ids });

    return this.response({ message: 'Notifications updated' });
  }

  @AutoBind()
  async markOneRead(req: Request<NotificationIdParams>) {
    const userId = this.getUserId(req);
    const { notificationId } = req.params;

    await this.markNotificationReadUC.execute({ viewerId: userId, notificationId });

    return this.response({ message: 'Notification marked read' });
  }
}
