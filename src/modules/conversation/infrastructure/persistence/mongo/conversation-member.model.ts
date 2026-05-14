import { EnumConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, enum_, minLength, nullable, object, optional, pipe, string } from 'valibot';

export const conversationMemberSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  conversation_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  role: enum_(EnumConversationMemberRole),
  joined_at: date(),
  last_read_at: optional(nullable(date(), null)),
  last_read_message_id: optional(nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null)),
  created_at: optional(date(), new Date()),
  updated_at: optional(date(), new Date())
});

export type ConversationMemberModel = InferOutput<typeof conversationMemberSchema>;
