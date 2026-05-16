import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { NotificationEntity } from '@/modules/notification/domain/entities/notification.entity';
import {
  EnumNotificationType,
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
      created_by_id: clone.createdById ?? null,
      updated_at: clone.updatedAt,
      updated_by_id: clone.updatedById ?? null,
      deleted_at: clone.deletedAt ?? null,
      deleted_by_id: clone.deletedById ?? null
    };

    switch (clone.type) {
      case EnumNotificationType.FRIEND_REQUEST:
        return parse(notificationSchema, {
          ...commonRecord,
          type: EnumNotificationType.FRIEND_REQUEST,
          payload: clone.payload as IFriendRequestNotificationPayload
        });
      case EnumNotificationType.FRIEND_ACCEPTED:
        return parse(notificationSchema, {
          ...commonRecord,
          type: EnumNotificationType.FRIEND_ACCEPTED,
          payload: clone.payload as IFriendAcceptedNotificationPayload
        });
      case EnumNotificationType.NEW_MESSAGE:
        return parse(notificationSchema, {
          ...commonRecord,
          type: EnumNotificationType.NEW_MESSAGE,
          payload: clone.payload as INewMessageNotificationPayload
        });
      case EnumNotificationType.ADDED_TO_GROUP:
        return parse(notificationSchema, {
          ...commonRecord,
          type: EnumNotificationType.ADDED_TO_GROUP,
          payload: clone.payload as IAddedToGroupNotificationPayload
        });
      default:
        throw new Error(`Unsupported notification type: ${String(clone.type)}`);
    }
  }
  toDomain(record: NotificationModel): NotificationEntity {
    const entity = new NotificationEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null,
      props: {
        recipientId: record.recipient_id,
        read: record.read,
        type: record.type,
        actor: record.actor,
        payload: record.payload
      }
    });
    return entity;
  }
  toResponse(record: NotificationModel): NotificationFullProps {
    const response = {
      id: record.id,
      recipientId: record.recipient_id,
      read: record.read,
      readAt: record.read_at ?? undefined,
      type: record.type,
      actor: record.actor,
      payload: record.payload,
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null
    };
    return response;
  }
}
