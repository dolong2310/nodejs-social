import { INotificationPayload, NotificationEntity } from '@/domain/entities/notification.entity';
import { INotificationModel } from '@/infrastructure/persistence/mongodb/models/notification.model';
import { ObjectId } from 'mongodb';

export class NotificationMapper {
  toPersistence(entity: Partial<NotificationEntity>): INotificationModel {
    const clone = entity;
    const record: INotificationModel = {
      _id: new ObjectId(clone.id),
      recipientId: new ObjectId(clone.recipientId),
      read: clone.read ?? false,
      createdAt: clone.createdAt ?? new Date(),
      type: clone.type ?? 'friend_request',
      actor: clone.actor ?? { userId: '', displayName: '' },
      payload: clone.payload as INotificationPayload
    };
    return record;
  }
  toDomain(record: INotificationModel): NotificationEntity {
    return NotificationEntity.create({
      id: record._id?.toString() ?? '',
      recipientId: record.recipientId.toString(),
      read: record.read,
      createdAt: record.createdAt,
      type: record.type,
      actor: record.actor,
      payload: record.payload
    });
  }
  toResponse() {}
}
