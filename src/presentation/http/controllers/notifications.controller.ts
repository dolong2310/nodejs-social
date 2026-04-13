import { INotificationsService } from '@/application/ports/notification.port';

import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import {
  MarkNotificationsReadBodyDTO,
  NotificationIdParams,
  NotificationListQueryDTO
} from '@/presentation/http/dtos/notification/notifications.request.dto';
import { OK } from '@/presentation/http/responses/success.response';

import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface INotificationsController {
  list(req: Request<ParamsDictionary, object, object, NotificationListQueryDTO>, res: Response): Promise<void>;
  markRead(req: Request<ParamsDictionary, object, MarkNotificationsReadBodyDTO>, res: Response): Promise<void>;
  markOneRead(req: Request<NotificationIdParams>, res: Response): Promise<void>;
}

export class NotificationsController extends BaseController implements INotificationsController {
  constructor(private readonly notificationsService: INotificationsService) {
    super();
  }

  @AutoBind()
  async list(req: Request<ParamsDictionary, object, object, NotificationListQueryDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { limit, cursor, unreadOnly: unreadRaw } = req.query;
    const unreadOnly =
      unreadRaw === 'true' || unreadRaw === '1' ? true : unreadRaw === 'false' || unreadRaw === '0' ? false : undefined;
    const { items, nextCursor } = await this.notificationsService.listForViewer({
      viewerId: userId,
      limit: Number(limit),
      cursor,
      unreadOnly
    });
    this.sendCursorPaginatedResponse({
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
    await this.notificationsService.markRead({ viewerId: userId, ids });
    this.sendResponse({ res, instance: OK, data: null, message: 'Notifications updated' });
  }

  @AutoBind()
  async markOneRead(req: Request<NotificationIdParams>, res: Response) {
    const userId = this.getUserId(req);
    const { notificationId } = req.params;
    await this.notificationsService.markSingleRead({ viewerId: userId, notificationId });
    this.sendResponse({ res, instance: OK, data: null, message: 'Notification marked read' });
  }
}
