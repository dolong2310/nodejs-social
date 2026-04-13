import { NotificationEntity } from '@/domain/entities/notification.entity';
import { DateIdCursor } from '@/domain/value-objects/date-id-cursor.value-object';

export interface IFindNotificationsInput extends Pick<NotificationEntity, 'recipientId'> {
  limit: number;
  before?: DateIdCursor;
  unreadOnly?: boolean;
  actorUserIdNin?: string[];
}

export interface IFindOldestNotificationIdsForTrimInput extends Pick<NotificationEntity, 'recipientId'> {
  take: number;
}

export interface IUpdateReadByIdsInput extends Pick<NotificationEntity, 'recipientId'> {
  ids: string[];
}

export interface IUpdateAllReadInput extends Pick<NotificationEntity, 'recipientId'> {}

export interface IDeleteNotificationsByIdsInput {
  ids: string[];
}

export interface ICountForRecipientInput extends Pick<NotificationEntity, 'recipientId'> {}

export interface IFindOldestNotificationIdsForTrimOutput {
  ids: string[];
}
