import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { NotificationEntity } from '@/modules/notification/domain/entities/notification.entity';
import {
  ENotificationType,
  IAddedToGroupNotificationPayload,
  IFriendAcceptedNotificationPayload,
  IFriendRequestNotificationPayload,
  INewMessageNotificationPayload,
  NotificationFullProps
} from '@/modules/notification/domain/entities/notification.type';
import {
  NotificationModel,
  notificationSchema
} from '@/modules/notification/infrastructure/persistence/postgres/notification.model';
import { parse } from 'valibot';

export class NotificationMapper implements Mapper<NotificationEntity, NotificationModel, NotificationFullProps> {
  toPersistence(entity: NotificationEntity): NotificationModel {
    const clone = entity.getProps();
    const commonRecord = {
      id: clone.id.toString(),
      recipient_id: clone.recipientId,
      read: clone.read,
      read_at: clone.readAt ?? new Date(),
      actor: clone.actor,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
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
    return new NotificationEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        recipientId: record.recipient_id,
        read: record.read,
        type: record.type,
        actor: record.actor,
        payload: record.payload
      }
    });
  }
  toResponse(record: NotificationModel): NotificationFullProps {
    return {
      id: record.id,
      recipientId: record.recipient_id,
      read: record.read,
      readAt: record.read_at ?? undefined,
      type: record.type,
      actor: record.actor,
      payload: record.payload,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
