import { DateIdCursor } from '@/modules/common/domain/value-objects/cursor.value-object';
import { NotificationProps } from '@/modules/notification/domain/entities/notification.type';

export interface FindNotificationsInput extends Pick<NotificationProps, 'recipientId'> {
  limit: number;
  before?: DateIdCursor;
  unreadOnly?: boolean;
  actorUserIdNin?: string[];
}

export interface FindOldestNotificationIdsForTrimInput extends Pick<NotificationProps, 'recipientId'> {
  limit: number;
}

export interface UpdateReadByIdsInput extends Pick<NotificationProps, 'recipientId'> {
  ids: string[];
}
