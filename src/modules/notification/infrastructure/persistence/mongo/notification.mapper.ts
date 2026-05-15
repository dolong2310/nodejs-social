import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { NotificationEntity } from '@/modules/notification/domain/entities/notification.entity';
import {
  EnumNotificationType,
  IAddedToGroupNotificationPayload,
  IFriendAcceptedNotificationPayload,
  IFriendRequestNotificationPayload,
  INewMessageNotificationPayload,
  INotificationPayload,
  NotificationFullProps
} from '@/modules/notification/domain/entities/notification.type';
import {
  NotificationModel,
  notificationSchema
} from '@/modules/notification/infrastructure/persistence/mongo/notification.model';
import { parse } from 'valibot';

export class NotificationMapper implements Mapper<NotificationEntity, NotificationModel, NotificationFullProps> {
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
      case EnumNotificationType.FRIEND_REQUEST:
        return parse(notificationSchema, {
          ...commonRecord,
          type: EnumNotificationType.FRIEND_REQUEST,
          payload: {
            from_user_id: (clone.payload as IFriendRequestNotificationPayload).fromUserId
          }
        });
      case EnumNotificationType.FRIEND_ACCEPTED:
        return parse(notificationSchema, {
          ...commonRecord,
          type: EnumNotificationType.FRIEND_ACCEPTED,
          payload: {
            friend_user_id: (clone.payload as IFriendAcceptedNotificationPayload).friendUserId
          }
        });
      case EnumNotificationType.NEW_MESSAGE: {
        const newMessagePayload = clone.payload as INewMessageNotificationPayload;
        return parse(notificationSchema, {
          ...commonRecord,
          type: EnumNotificationType.NEW_MESSAGE,
          payload: {
            conversation_id: newMessagePayload.conversationId,
            message_id: newMessagePayload.messageId,
            preview_text: newMessagePayload.previewText,
            preview_kind: newMessagePayload.previewKind
          }
        });
      }
      case EnumNotificationType.ADDED_TO_GROUP: {
        const addedToGroupPayload = clone.payload as IAddedToGroupNotificationPayload;
        return parse(notificationSchema, {
          ...commonRecord,
          type: EnumNotificationType.ADDED_TO_GROUP,
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
      case EnumNotificationType.FRIEND_REQUEST:
        payload = { fromUserId: record.payload.from_user_id };
        break;
      case EnumNotificationType.FRIEND_ACCEPTED:
        payload = { friendUserId: record.payload.friend_user_id };
        break;
      case EnumNotificationType.NEW_MESSAGE:
        payload = {
          conversationId: record.payload.conversation_id,
          messageId: record.payload.message_id,
          previewText: record.payload.preview_text,
          previewKind: record.payload.preview_kind
        };
        break;
      case EnumNotificationType.ADDED_TO_GROUP:
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
  toResponse(record: NotificationModel): NotificationFullProps {
    let payload: INotificationPayload;
    switch (record.type) {
      case EnumNotificationType.FRIEND_REQUEST:
        payload = { fromUserId: record.payload.from_user_id };
        break;
      case EnumNotificationType.FRIEND_ACCEPTED:
        payload = { friendUserId: record.payload.friend_user_id };
        break;
      case EnumNotificationType.NEW_MESSAGE:
        payload = {
          conversationId: record.payload.conversation_id,
          messageId: record.payload.message_id,
          previewText: record.payload.preview_text,
          previewKind: record.payload.preview_kind
        };
        break;
      case EnumNotificationType.ADDED_TO_GROUP:
        payload = {
          conversationId: record.payload.conversation_id,
          chatName: record.payload.chat_name
        };
        break;
    }

    const response = {
      id: record._id,
      recipientId: record.recipient_id,
      read: record.read,
      readAt: record.read_at,
      type: record.type,
      actor: {
        userId: record.actor.user_id,
        displayName: record.actor.display_name,
        avatar: record.actor.avatar
      },
      payload,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
    return response;
  }
}
