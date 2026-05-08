import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import { NotificationEntity } from '@/modules/notification/domain/entities/notification.entity';
import {
  IFindNotificationsInput,
  IFindOldestNotificationIdsForTrimInput,
  IUpdateReadByIdsInput
} from '@/modules/notification/domain/repositories/notification.repository.type';

export interface NotificationRepositoryPort extends RepositoryPort<NotificationEntity> {
  findNotifications(data: IFindNotificationsInput): Promise<NotificationEntity[]>;
  findOldestNotificationIdsForTrim(data: IFindOldestNotificationIdsForTrimInput): Promise<string[]>;
  createNotification(data: NotificationEntity): Promise<NotificationEntity>;
  createNotifications(data: NotificationEntity[]): Promise<void>;
  updateReadByIds(data: IUpdateReadByIdsInput): Promise<number>;
  updateAllRead(recipientId: string): Promise<number>;
  deleteNotificationsByIds(ids: string[]): Promise<number>;
  countForRecipient(recipientId: string): Promise<number>;
}
