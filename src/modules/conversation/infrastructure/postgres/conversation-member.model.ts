import { EConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, enum_, minLength, nullable, object, pipe, string } from 'valibot';

export const conversationMemberSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  conversation_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  role: enum_(EConversationMemberRole),
  joined_at: date(),
  last_read_at: nullable(date(), null),
  last_read_message_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  created_at: date(),
  updated_at: date()
});

export type ConversationMemberModel = InferOutput<typeof conversationMemberSchema>;
