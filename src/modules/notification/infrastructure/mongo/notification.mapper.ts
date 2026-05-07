import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { NotificationEntity } from '@/modules/notification/domain/entities/notification.entity';
import {
  ENotificationType,
  IAddedToGroupNotificationPayload,
  IFriendAcceptedNotificationPayload,
  IFriendRequestNotificationPayload,
  INotificationPayload,
  INewMessageNotificationPayload
} from '@/modules/notification/domain/entities/notification.type';
import { NotificationModel, notificationSchema } from '@/modules/notification/infrastructure/mongo/notification.model';
import { parse } from 'valibot';

export class NotificationMapper implements Mapper<NotificationEntity, NotificationModel> {
  toPersistence(entity: NotificationEntity): NotificationModel {
    const clone = entity.getProps();
    const commonRecord = {
      _id: clone.id.toString(),
      recipient_id: clone.recipientId,
      read: clone.read,
      read_at: clone.readAt ?? new Date(),
      actor: {
        user_id: clone.actor.userId,
        display_name: clone.actor.displayName,
        avatar: clone.actor.avatar
      },
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };

    switch (clone.type) {
      case ENotificationType.FRIEND_REQUEST:
        return parse(notificationSchema, {
          ...commonRecord,
          type: ENotificationType.FRIEND_REQUEST,
          payload: {
            from_user_id: (clone.payload as IFriendRequestNotificationPayload).fromUserId
          }
        });
      case ENotificationType.FRIEND_ACCEPTED:
        return parse(notificationSchema, {
          ...commonRecord,
          type: ENotificationType.FRIEND_ACCEPTED,
          payload: {
            friend_user_id: (clone.payload as IFriendAcceptedNotificationPayload).friendUserId
          }
        });
      case ENotificationType.NEW_MESSAGE: {
        const newMessagePayload = clone.payload as INewMessageNotificationPayload;
        return parse(notificationSchema, {
          ...commonRecord,
          type: ENotificationType.NEW_MESSAGE,
          payload: {
            conversation_id: newMessagePayload.conversationId,
            message_id: newMessagePayload.messageId,
            preview_text: newMessagePayload.previewText,
            preview_kind: newMessagePayload.previewKind
          }
        });
      }
      case ENotificationType.ADDED_TO_GROUP: {
        const addedToGroupPayload = clone.payload as IAddedToGroupNotificationPayload;
        return parse(notificationSchema, {
          ...commonRecord,
          type: ENotificationType.ADDED_TO_GROUP,
          payload: {
            conversation_id: addedToGroupPayload.conversationId,
            chat_name: addedToGroupPayload.chatName
          }
        });
      }
      default:
        throw new Error(`Unsupported notification type: ${String(clone.type)}`);
    }
  }
  toDomain(record: NotificationModel): NotificationEntity {
    let payload: INotificationPayload;
    switch (record.type) {
      case ENotificationType.FRIEND_REQUEST:
        payload = { fromUserId: record.payload.from_user_id };
        break;
      case ENotificationType.FRIEND_ACCEPTED:
        payload = { friendUserId: record.payload.friend_user_id };
        break;
      case ENotificationType.NEW_MESSAGE:
        payload = {
          conversationId: record.payload.conversation_id,
          messageId: record.payload.message_id,
          previewText: record.payload.preview_text,
          previewKind: record.payload.preview_kind
        };
        break;
      case ENotificationType.ADDED_TO_GROUP:
        payload = {
          conversationId: record.payload.conversation_id,
          chatName: record.payload.chat_name
        };
        break;
    }

    const entity = new NotificationEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        recipientId: record.recipient_id,
        read: record.read,
        type: record.type,
        actor: {
          userId: record.actor.user_id,
          displayName: record.actor.display_name,
          avatar: record.actor.avatar
        },
        payload
      }
    });
    return entity;
  }
  toResponse() {}
}
