import { ENewMessagePreviewKind, ENotificationType } from '@/modules/notification/domain/entities/notification.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import {
  type InferOutput,
  boolean,
  date,
  enum_,
  literal,
  minLength,
  object,
  optional,
  pipe,
  string,
  variant
} from 'valibot';

const friendRequestPayloadSchema = object({
  fromUserId: pipe(string(), minLength(ENTITY_ID_LENGTH))
});

const friendAcceptedPayloadSchema = object({
  friendUserId: pipe(string(), minLength(ENTITY_ID_LENGTH))
});

const newMessagePayloadSchema = object({
  conversationId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  messageId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  previewText: optional(string()),
  previewKind: enum_(ENewMessagePreviewKind)
});

const addedToGroupPayloadSchema = object({
  conversationId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  chatName: optional(string())
});

const baseNotificationSchema = {
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  recipientId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  read: boolean(),
  readAt: optional(date(), new Date()),
  actor: object({
    userId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
    displayName: string(),
    avatar: optional(string())
  }),
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
};

export const notificationSchema = variant('type', [
  object({
    ...baseNotificationSchema,
    type: literal(ENotificationType.FRIEND_REQUEST),
    payload: friendRequestPayloadSchema
  }),
  object({
    ...baseNotificationSchema,
    type: literal(ENotificationType.FRIEND_ACCEPTED),
    payload: friendAcceptedPayloadSchema
  }),
  object({
    ...baseNotificationSchema,
    type: literal(ENotificationType.NEW_MESSAGE),
    payload: newMessagePayloadSchema
  }),
  object({
    ...baseNotificationSchema,
    type: literal(ENotificationType.ADDED_TO_GROUP),
    payload: addedToGroupPayloadSchema
  })
]);

export type NotificationModel = InferOutput<typeof notificationSchema>;
