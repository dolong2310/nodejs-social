import { CursorPaginationQueryDTO } from '@/shared/dtos/common.request.dto';
import { ParamsDictionary } from 'express-serve-static-core';

export class MarkNotificationsReadBodyDTO {
  ids?: string[];
  constructor(body: { ids?: string[] }) {
    this.ids = body.ids;
  }
}

export interface NotificationListQueryDTO extends CursorPaginationQueryDTO {
  unreadOnly?: string;
}

export interface NotificationIdParams extends ParamsDictionary {
  notificationId: string;
}
