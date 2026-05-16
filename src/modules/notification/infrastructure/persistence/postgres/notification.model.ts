import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import {
  EnumNewMessagePreviewKind,
  EnumNotificationType
} from '@/modules/notification/domain/entities/notification.type';
import {
  type InferOutput,
  boolean,
  date,
  enum_,
  literal,
  minLength,
  nullable,
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
  previewKind: enum_(EnumNewMessagePreviewKind)
});

const addedToGroupPayloadSchema = object({
  conversationId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  chatName: optional(string())
});

const baseNotificationSchema = {
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  recipient_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  read: boolean(),
  read_at: nullable(date(), null),
  actor: object({
    userId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
    displayName: string(),
    avatar: optional(string())
  }),
  created_at: date(),
  created_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  updated_at: date(),
  updated_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  deleted_at: nullable(date(), null),
  deleted_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null)
};

export const notificationSchema = variant('type', [
  object({
    ...baseNotificationSchema,
    type: literal(EnumNotificationType.FRIEND_REQUEST),
    payload: friendRequestPayloadSchema
  }),
  object({
    ...baseNotificationSchema,
    type: literal(EnumNotificationType.FRIEND_ACCEPTED),
    payload: friendAcceptedPayloadSchema
  }),
  object({
    ...baseNotificationSchema,
    type: literal(EnumNotificationType.NEW_MESSAGE),
    payload: newMessagePayloadSchema
  }),
  object({
    ...baseNotificationSchema,
    type: literal(EnumNotificationType.ADDED_TO_GROUP),
    payload: addedToGroupPayloadSchema
  })
]);

export type NotificationModel = InferOutput<typeof notificationSchema>;
