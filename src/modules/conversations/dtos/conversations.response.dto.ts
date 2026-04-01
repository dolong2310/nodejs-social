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

export function toConversationSummary(conv: IConversation, peerUserIdHex?: string): ConversationSummaryResponseDTO {
  const base: ConversationSummaryResponseDTO = {
    id: conv._id.toHexString(),
    type: conv.type,
    createdBy: conv.createdBy.toHexString(),
    name: conv.name,
    avatarMediaId: conv.avatarMediaId?.toHexString() ?? null,
    updatedAt: conv.updatedAt.toISOString(),
    createdAt: conv.createdAt.toISOString()
  };
  if (peerUserIdHex) {
    base.peerUserId = peerUserIdHex;
  }
  return base;
}

export function toConversationMemberRow(m: IConversationMember): ConversationMemberRowDTO {
  return {
    userId: m.userId.toHexString(),
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    lastReadMessageId: m.lastReadMessageId?.toHexString() ?? null,
    lastReadAt: m.lastReadAt?.toISOString() ?? null
  };
}
