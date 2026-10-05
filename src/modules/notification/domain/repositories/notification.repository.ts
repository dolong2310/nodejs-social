import type { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import type { NotificationEntity } from '@/modules/notification/domain/entities/notification.entity';
import type {
  FindNotificationsInput,
  FindOldestNotificationIdsForTrimInput,
  UpdateReadByIdsInput
} from '@/modules/notification/domain/repositories/notification.repository.types';

export interface NotificationRepositoryPort extends RepositoryPort<NotificationEntity> {
  findNotifications(data: FindNotificationsInput): Promise<NotificationEntity[]>;
  findOldestNotificationIdsForTrim(data: FindOldestNotificationIdsForTrimInput): Promise<string[]>;
  createNotification(data: NotificationEntity): Promise<NotificationEntity>;
  createNotifications(data: NotificationEntity[]): Promise<void>;
  updateReadByIds(data: UpdateReadByIdsInput): Promise<number>;
  updateAllRead(recipientId: string): Promise<number>;
  deleteNotificationsByIds(ids: string[]): Promise<number>;
  countForRecipient(recipientId: string): Promise<number>;
}
