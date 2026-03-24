import { EConversationType, IConversation } from '@/models/schemas/conversation.schema';
import { EConversationMemberRole, IConversationMember } from '@/models/schemas/conversationMember.schema';
import { ObjectId } from 'mongodb';

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

export function toConversationSummary(conv: IConversation, peerUserId?: ObjectId): ConversationSummaryResponseDTO {
  const base: ConversationSummaryResponseDTO = {
    id: conv._id.toHexString(),
    type: conv.type,
    createdBy: conv.createdBy.toHexString(),
    name: conv.name,
    avatarMediaId: conv.avatarMediaId?.toHexString() ?? null,
    updatedAt: conv.updatedAt.toISOString(),
    createdAt: conv.createdAt.toISOString()
  };
  if (peerUserId) {
    base.peerUserId = peerUserId.toHexString();
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
