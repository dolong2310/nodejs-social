import { EnumConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, enum_, minLength, nullable, object, optional, pipe, string } from 'valibot';

export const conversationSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  type: enum_(EnumConversationType),
  created_by: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: optional(string()),
  avatar_media_id: optional(nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null)),
  user_id_low: optional(pipe(string(), minLength(ENTITY_ID_LENGTH))),
  user_id_high: optional(pipe(string(), minLength(ENTITY_ID_LENGTH))),
  created_at: optional(date(), new Date()),
  created_by_id: optional(nullable(string(), null), null),
  updated_at: optional(date(), new Date()),
  updated_by_id: optional(nullable(string(), null), null),
  deleted_at: optional(nullable(date(), null), null),
  deleted_by_id: optional(nullable(string(), null), null)
});

export type ConversationModel = InferOutput<typeof conversationSchema>;
