import { EnumConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, enum_, minLength, nullable, object, pipe, string } from 'valibot';

export const conversationMemberSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  conversation_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  role: enum_(EnumConversationMemberRole),
  joined_at: date(),
  last_read_at: nullable(date(), null),
  last_read_message_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  created_at: date(),
  created_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  updated_at: date(),
  updated_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  deleted_at: nullable(date(), null),
  deleted_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null)
});

export type ConversationMemberModel = InferOutput<typeof conversationMemberSchema>;
