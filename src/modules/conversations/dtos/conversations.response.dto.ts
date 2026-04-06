import { EConversationMemberRole, IConversationMember } from '@/modules/conversations/conversationMember.schema';
import { EConversationType, IConversation } from '@/modules/conversations/conversations.schema';

export interface ConversationMemberRowDTO {
  userId: string;
  role: EConversationMemberRole;
  joinedAt: string;
  lastReadMessageId?: string | null;
  lastReadAt?: string | null;
}

export interface ConversationSummaryResponseDTO {
  id: string;
  type: EConversationType;
  createdBy: string;
  name?: string;
  avatarMediaId?: string | null;
  peerUserId?: string;
  updatedAt: string;
  createdAt: string;
}

export interface ConversationDetailResponseDTO extends ConversationSummaryResponseDTO {
  members: ConversationMemberRowDTO[];
}

export function toConversationSummary(conv: IConversation, peerUserId?: string): ConversationSummaryResponseDTO {
  const base: ConversationSummaryResponseDTO = {
    id: conv._id.toString(),
    type: conv.type,
    createdBy: conv.createdBy.toString(),
    name: conv.name,
    avatarMediaId: conv.avatarMediaId?.toString() ?? null,
    updatedAt: conv.updatedAt.toISOString(),
    createdAt: conv.createdAt.toISOString()
  };
  if (peerUserId) {
    base.peerUserId = peerUserId;
  }
  return base;
}

export function toConversationMemberRow(m: IConversationMember): ConversationMemberRowDTO {
  return {
    userId: m.userId.toString(),
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    lastReadMessageId: m.lastReadMessageId?.toString() ?? null,
    lastReadAt: m.lastReadAt?.toISOString() ?? null
  };
}
