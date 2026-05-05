import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { NotificationEntity } from '@/modules/notification/domain/entities/notification.entity';
import {
  ENotificationType,
  IAddedToGroupNotificationPayload,
  IFriendAcceptedNotificationPayload,
  IFriendRequestNotificationPayload,
  INewMessageNotificationPayload
} from '@/modules/notification/domain/entities/notification.type';
import { NotificationModel, notificationSchema } from '@/modules/notification/infrastructure/mongo/notification.model';
import { parse } from 'valibot';

export class NotificationMapper implements Mapper<NotificationEntity, NotificationModel> {
  toPersistence(entity: NotificationEntity): NotificationModel {
    const clone = entity.getProps();
    const commonRecord = {
      _id: clone.id.toString(),
      recipientId: clone.recipientId,
      read: clone.read,
      readAt: clone.readAt ?? new Date(),
      actor: clone.actor,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };

    switch (clone.type) {
      case ENotificationType.FRIEND_REQUEST:
        return parse(notificationSchema, {
          ...commonRecord,
          type: ENotificationType.FRIEND_REQUEST,
          payload: clone.payload as IFriendRequestNotificationPayload
        });
      case ENotificationType.FRIEND_ACCEPTED:
        return parse(notificationSchema, {
          ...commonRecord,
          type: ENotificationType.FRIEND_ACCEPTED,
          payload: clone.payload as IFriendAcceptedNotificationPayload
        });
      case ENotificationType.NEW_MESSAGE:
        return parse(notificationSchema, {
          ...commonRecord,
          type: ENotificationType.NEW_MESSAGE,
          payload: clone.payload as INewMessageNotificationPayload
        });
      case ENotificationType.ADDED_TO_GROUP:
        return parse(notificationSchema, {
          ...commonRecord,
          type: ENotificationType.ADDED_TO_GROUP,
          payload: clone.payload as IAddedToGroupNotificationPayload
        });
      default:
        throw new Error(`Unsupported notification type: ${String(clone.type)}`);
    }
  }
  toDomain(record: NotificationModel): NotificationEntity {
    const entity = new NotificationEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        recipientId: record.recipientId,
        read: record.read,
        type: record.type,
        actor: record.actor,
        payload: record.payload
      }
    });
    return entity;
  }
  toResponse() {}
}
