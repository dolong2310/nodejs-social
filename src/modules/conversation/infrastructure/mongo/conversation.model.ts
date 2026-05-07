import { EConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, enum_, minLength, nullable, object, optional, pipe, string } from 'valibot';

export const conversationSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  type: enum_(EConversationType),
  created_by: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: optional(string()),
  avatar_media_id: optional(nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null)),
  user_id_low: optional(pipe(string(), minLength(ENTITY_ID_LENGTH))),
  user_id_high: optional(pipe(string(), minLength(ENTITY_ID_LENGTH))),
  created_at: optional(date(), new Date()),
  updated_at: optional(date(), new Date())
});

export type ConversationModel = InferOutput<typeof conversationSchema>;
