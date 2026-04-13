import { IConversationMember } from '@/domain/entities/conversation-member.entity';
import { IConversation } from '@/domain/entities/conversation.entity';
import { EConversationMemberRole } from '@/domain/enums/conversation-member.enum';
import { EConversationType } from '@/domain/enums/conversation.enum';

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
    id: conv.id,
    type: conv.type,
    createdBy: conv.createdBy,
    name: conv.name,
    avatarMediaId: conv.avatarMediaId ?? null,
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
    userId: m.userId,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    lastReadMessageId: m.lastReadMessageId ?? null,
    lastReadAt: m.lastReadAt?.toISOString() ?? null
  };
}
