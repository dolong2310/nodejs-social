import { INotification } from '@/domain/entities/notification.entity';
import {
  ICountForRecipientInput,
  IDeleteNotificationsByIdsInput,
  IFindNotificationsInput,
  IFindOldestNotificationIdsForTrimInput,
  IFindOldestNotificationIdsForTrimOutput,
  IUpdateAllReadInput,
  IUpdateReadByIdsInput
} from '@/domain/repositories/notification/notification.interface';

export interface INotificationRepository {
  findNotifications(data: IFindNotificationsInput): Promise<INotification[]>;
  findOldestNotificationIdsForTrim(
    data: IFindOldestNotificationIdsForTrimInput
  ): Promise<IFindOldestNotificationIdsForTrimOutput>;
  createNotification(data: INotification): Promise<INotification>;
  createNotifications(data: INotification[]): Promise<void>;
  updateReadByIds(data: IUpdateReadByIdsInput): Promise<number>;
  updateAllRead(data: IUpdateAllReadInput): Promise<number>;
  deleteNotificationsByIds(data: IDeleteNotificationsByIdsInput): Promise<number>;
  countForRecipient(data: ICountForRecipientInput): Promise<number>;
}
