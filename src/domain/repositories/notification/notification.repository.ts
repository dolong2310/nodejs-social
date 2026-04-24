import { NotificationEntity } from '@/domain/entities/notification/notification.entity';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';
import {
  IFindNotificationsInput,
  IFindOldestNotificationIdsForTrimInput,
  IUpdateReadByIdsInput
} from '@/domain/repositories/notification/notification.repository.type';

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
