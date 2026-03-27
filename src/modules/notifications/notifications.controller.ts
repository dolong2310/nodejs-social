import { BaseController, INotificationsService, MarkNotificationsReadBodyDTO } from '@/modules';
import { OK } from '@/providers';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface NotificationIdParams extends ParamsDictionary {
  notificationId: string;
}

export interface INotificationsController {
  list(req: Request, res: Response): Promise<void>;
  markRead(req: Request<ParamsDictionary, object, MarkNotificationsReadBodyDTO>, res: Response): Promise<void>;
  markOneRead(req: Request<NotificationIdParams>, res: Response): Promise<void>;
}

export class NotificationsController extends BaseController implements INotificationsController {
  constructor(private readonly notificationsService: INotificationsService) {
    super();
  }

  list = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const unreadRaw = req.query.unreadOnly;
    const unreadOnly =
      unreadRaw === 'true' || unreadRaw === '1' ? true : unreadRaw === 'false' || unreadRaw === '0' ? false : undefined;
    const page = await this.notificationsService.listForViewer(userId, limit, cursor, unreadOnly);
    this.sendResponse({ res, data: page, message: 'Notifications loaded' });
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
