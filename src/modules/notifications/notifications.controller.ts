import {
  BaseController,
  INotificationsService,
  MarkNotificationsReadBodyDTO,
  NotificationIdParams,
  NotificationListQueryDTO
} from '@/modules';
import { OK } from '@/providers';
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

  list = async (req: Request<ParamsDictionary, object, object, NotificationListQueryDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const { limit, cursor, unreadOnly: unreadRaw } = req.query;
    const unreadOnly =
      unreadRaw === 'true' || unreadRaw === '1' ? true : unreadRaw === 'false' || unreadRaw === '0' ? false : undefined;
    const page = await this.notificationsService.listForViewer(userId, Number(limit), cursor, unreadOnly);
    this.sendCursorPaginatedResponse({
      res,
      items: page.notifications,
      nextCursor: page.nextCursor,
      message: 'Notifications loaded'
    });
  };

  markRead = async (req: Request<ParamsDictionary, object, MarkNotificationsReadBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const body = new MarkNotificationsReadBodyDTO(req.body);
    const ids = body.ids && body.ids.length > 0 ? body.ids : undefined;
    await this.notificationsService.markRead(userId, ids);
    this.sendResponse({ res, instance: OK, data: null, message: 'Notifications updated' });
  };

  markOneRead = async (req: Request<NotificationIdParams>, res: Response) => {
    const userId = this.getUserId(req);
    await this.notificationsService.markSingleRead(userId, req.params.notificationId);
    this.sendResponse({ res, instance: OK, data: null, message: 'Notification marked read' });
  };
}
