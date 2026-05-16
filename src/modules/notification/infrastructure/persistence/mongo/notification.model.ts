import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import {
  EnumNewMessagePreviewKind,
  EnumNotificationType
} from '@/modules/notification/domain/entities/notification.type';
import {
  type InferOutput,
  boolean,
  date,
  nullable,
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
  from_user_id: pipe(string(), minLength(ENTITY_ID_LENGTH))
});

const friendAcceptedPayloadSchema = object({
  friend_user_id: pipe(string(), minLength(ENTITY_ID_LENGTH))
});

const newMessagePayloadSchema = object({
  conversation_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  message_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  preview_text: optional(string()),
  preview_kind: enum_(EnumNewMessagePreviewKind)
});

const addedToGroupPayloadSchema = object({
  conversation_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  chat_name: optional(string())
});

const baseNotificationSchema = {
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  recipient_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  read: boolean(),
  read_at: optional(date(), new Date()),
  actor: object({
    user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
    display_name: string(),
    avatar: optional(string())
  }),
  created_at: optional(date(), new Date()),
  created_by_id: optional(nullable(string(), null), null),
  updated_at: optional(date(), new Date()),
  updated_by_id: optional(nullable(string(), null), null),
  deleted_at: optional(nullable(date(), null), null),
  deleted_by_id: optional(nullable(string(), null), null)
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
