import { INotification } from '@/domain/entities/notification.entity';
import { ObjectId } from 'mongodb';

export interface INotificationModel extends Omit<INotification, 'id' | 'recipientId'> {
  _id?: ObjectId;
  recipientId: ObjectId;
}
