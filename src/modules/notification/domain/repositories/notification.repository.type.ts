import { DateIdCursor } from '@/modules/common/domain/value-objects/date-id-cursor.value-object';
import { NotificationProps } from '@/modules/notification/domain/entities/notification.type';

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
