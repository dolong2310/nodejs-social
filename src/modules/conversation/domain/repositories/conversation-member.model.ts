import { EConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, enum_, minLength, nullable, object, optional, pipe, string } from 'valibot';

export const conversationMemberSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  conversationId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  userId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  role: enum_(EConversationMemberRole),
  joinedAt: date(),
  lastReadAt: optional(nullable(date(), null)),
  lastReadMessageId: optional(nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null)),
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
});

export type ConversationMemberModel = InferOutput<typeof conversationMemberSchema>;
