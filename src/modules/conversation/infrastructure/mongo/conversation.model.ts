import { EConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, enum_, minLength, nullable, object, optional, pipe, string } from 'valibot';

export const conversationSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  type: enum_(EConversationType),
  createdBy: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: optional(string()),
  avatarMediaId: optional(nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null)),
  userIdLow: optional(pipe(string(), minLength(ENTITY_ID_LENGTH))),
  userIdHigh: optional(pipe(string(), minLength(ENTITY_ID_LENGTH))),
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
});

export type ConversationModel = InferOutput<typeof conversationSchema>;
