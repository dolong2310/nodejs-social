import { EnumConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.types';
import { EnumConversationType } from '@/modules/conversation/domain/entities/conversation.types';
import { array, enum_, type InferOutput, nullish, object, optional, string } from 'valibot';
import { responseDateSchema } from '@/presentation/http/express/v1/schemas/common/response.schema';

/** `object()` strips internal fields such as `userIdLow` / `userIdHigh`. */
export const ConversationResponseSchema = object({
  id: string(),
  type: enum_(EnumConversationType),
  createdBy: string(),
  name: optional(string()),
  avatarMediaId: nullish(string()),
  peerUserId: optional(string()),
  updatedAt: responseDateSchema,
  createdAt: responseDateSchema
});
export type ConversationResponse = InferOutput<typeof ConversationResponseSchema>;

export const ConversationMemberResponseSchema = object({
  id: string(),
  conversationId: string(),
  userId: string(),
  role: enum_(EnumConversationMemberRole),
  joinedAt: responseDateSchema,
  lastReadAt: nullish(responseDateSchema),
  lastReadMessageId: nullish(string()),
  createdAt: responseDateSchema,
  updatedAt: responseDateSchema
});

export const ConversationDetailResponseSchema = object({
  ...ConversationResponseSchema.entries,
  members: array(ConversationMemberResponseSchema)
});
export type ConversationDetailResponse = InferOutput<typeof ConversationDetailResponseSchema>;
