import { EnumConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, enum_, minLength, nullable, object, pipe, string } from 'valibot';

export const conversationSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  type: enum_(EnumConversationType),
  created_by: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: nullable(string(), null),
  avatar_media_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  user_id_low: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  user_id_high: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  created_at: date(),
  created_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  updated_at: date(),
  updated_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  deleted_at: nullable(date(), null),
  deleted_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null)
});

export type ConversationModel = InferOutput<typeof conversationSchema>;
