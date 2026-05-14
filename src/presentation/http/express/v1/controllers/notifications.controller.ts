import { ListNotificationsPort } from '@/modules/notification/application/use-cases/list-notifications/list-notifications.port';
import { MarkNotificationReadPort } from '@/modules/notification/application/use-cases/mark-notification-read/mark-notification-read.port';
import { MarkNotificationsReadPort } from '@/modules/notification/application/use-cases/mark-notifications-read/mark-notifications-read.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import {
  MarkNotificationsReadBodyDTO,
  NotificationIdParams,
  NotificationListQueryDTO
} from '@/presentation/http/express/v1/dtos/notification/notification.request.dto';
import { NotificationResponseDTO } from '@/presentation/http/express/v1/dtos/notification/notification.response.dto';
import { NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface INotificationController {
  list(
    req: ExpressRequest<ParamsDictionary, object, object, NotificationListQueryDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  markRead(
    req: ExpressRequest<ParamsDictionary, object, MarkNotificationsReadBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  markOneRead(req: ExpressRequest<NotificationIdParams>, res: ExpressResponse, next: NextFunction): Promise<unknown>;
}

export class NotificationsController extends BaseController implements INotificationController {
  constructor(
    private readonly listNotificationsUC: ListNotificationsPort,
    private readonly markNotificationsReadUC: MarkNotificationsReadPort,
    private readonly markNotificationReadUC: MarkNotificationReadPort
  ) {
    super();
  }

  @AutoBind()
  async list(req: ExpressRequest<ParamsDictionary, object, object, NotificationListQueryDTO>) {
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
  async markRead(req: ExpressRequest<ParamsDictionary, object, MarkNotificationsReadBodyDTO>) {
    const userId = this.getUserId(req);
    const body = new MarkNotificationsReadBodyDTO(req.body);
    const ids = body.ids && body.ids.length > 0 ? body.ids : undefined;

    await this.markNotificationsReadUC.execute({ viewerId: userId, ids });

    return this.response({ message: 'Notifications updated' });
  }

  @AutoBind()
  async markOneRead(req: ExpressRequest<NotificationIdParams>) {
    const userId = this.getUserId(req);
    const { notificationId } = req.params;

    await this.markNotificationReadUC.execute({ viewerId: userId, notificationId });

    return this.response({ message: 'Notification marked read' });
  }
}
