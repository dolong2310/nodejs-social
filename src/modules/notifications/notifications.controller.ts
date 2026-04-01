import { AutoBind } from '@/decorators';
import { Injectable } from '@/decorators/injectable.decorator';
import { BaseController } from '@/modules/base/base.controller';
import {
  MarkNotificationsReadBodyDTO,
  NotificationIdParams,
  NotificationListQueryDTO
} from '@/modules/notifications/dtos/notifications.request.dto';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { OK } from '@/providers/httpResponses/success.response';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface INotificationsController {
  list(req: Request<ParamsDictionary, object, object, NotificationListQueryDTO>, res: Response): Promise<void>;
  markRead(req: Request<ParamsDictionary, object, MarkNotificationsReadBodyDTO>, res: Response): Promise<void>;
  markOneRead(req: Request<NotificationIdParams>, res: Response): Promise<void>;
}

@Injectable()
export class NotificationsController extends BaseController implements INotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  @AutoBind()
  async list(req: Request<ParamsDictionary, object, object, NotificationListQueryDTO>, res: Response) {
    const userId = this.getUserId(req);
    const { limit, cursor, unreadOnly: unreadRaw } = req.query;
    const unreadOnly =
      unreadRaw === 'true' || unreadRaw === '1' ? true : unreadRaw === 'false' || unreadRaw === '0' ? false : undefined;
    const { items, nextCursor } = await this.notificationsService.listForViewer(
      userId,
      Number(limit),
      cursor,
      unreadOnly
    );
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
    await this.notificationsService.markRead(userId, ids);
    this.sendResponse({ res, instance: OK, data: null, message: 'Notifications updated' });
  }

  @AutoBind()
  async markOneRead(req: Request<NotificationIdParams>, res: Response) {
    const userId = this.getUserId(req);
    await this.notificationsService.markSingleRead(userId, req.params.notificationId);
    this.sendResponse({ res, instance: OK, data: null, message: 'Notification marked read' });
  }
}
