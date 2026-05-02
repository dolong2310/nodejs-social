import { NotificationProps } from '@/modules/notification/domain/entities/notification.type';
import { DateIdCursor } from '@/modules/core/domain/value-objects/date-id-cursor.value-object';

export interface IFindNotificationsInput extends Pick<NotificationProps, 'recipientId'> {
  limit: number;
  before?: DateIdCursor;
  unreadOnly?: boolean;
  actorUserIdNin?: string[];
}

export interface IFindOldestNotificationIdsForTrimInput extends Pick<NotificationProps, 'recipientId'> {
  limit: number;
}

export interface IUpdateReadByIdsInput extends Pick<NotificationProps, 'recipientId'> {
  ids: string[];
}
