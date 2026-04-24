import { ListNotificationsInPort } from '@/application/use-cases/notification/list-notifications/list-notifications.in-port';
import { MarkNotificationReadInPort } from '@/application/use-cases/notification/mark-notification-read/mark-notification-read.in-port';
import { MarkNotificationsReadInPort } from '@/application/use-cases/notification/mark-notifications-read/mark-notifications-read.in-port';
import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import {
  MarkNotificationsReadBodyDTO,
  NotificationIdParams,
  NotificationListQueryDTO
} from '@/presentation/http/dtos/notification/notification.request.dto';
import { NotificationResponseDTO } from '@/presentation/http/dtos/notification/notification.response.dto';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface INotificationController {
  list(req: Request<ParamsDictionary, object, object, NotificationListQueryDTO>, res: Response): Promise<void>;
  markRead(req: Request<ParamsDictionary, object, MarkNotificationsReadBodyDTO>, res: Response): Promise<void>;
  markOneRead(req: Request<NotificationIdParams>, res: Response): Promise<void>;
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
  async list(req: Request<ParamsDictionary, object, object, NotificationListQueryDTO>, res: Response) {
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

    this.sendCursorPaginatedResponse<NotificationResponseDTO>({
      res,
      items,
      nextCursor,
      message: 'Notifications loaded'
    });
  }

  @AutoBind()
  async markRead(req: Request<ParamsDictionary, object, MarkNotificationsReadBodyDTO>, res: Response) {
    const userId = this.getUserId(req);
    const body = new MarkNotificationsReadBodyDTO(req.body);
    const ids = body.ids && body.ids.length > 0 ? body.ids : undefined;

    await this.markNotificationsReadUC.execute({ viewerId: userId, ids });

    this.sendResponse({ res, message: 'Notifications updated' });
  }

  @AutoBind()
  async markOneRead(req: Request<NotificationIdParams>, res: Response) {
    const userId = this.getUserId(req);
    const { notificationId } = req.params;

    await this.markNotificationReadUC.execute({ viewerId: userId, notificationId });

    this.sendResponse({ res, message: 'Notification marked read' });
  }
}
