import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { ENewMessagePreviewKind, ENotificationType } from '@/modules/notification/domain/entities/notification.type';
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
  from_user_id: pipe(string(), minLength(ENTITY_ID_LENGTH))
});

const friendAcceptedPayloadSchema = object({
  friend_user_id: pipe(string(), minLength(ENTITY_ID_LENGTH))
});

const newMessagePayloadSchema = object({
  conversation_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  message_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  preview_text: optional(string()),
  preview_kind: enum_(ENewMessagePreviewKind)
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
  updated_at: optional(date(), new Date())
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
