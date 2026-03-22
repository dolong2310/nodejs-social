import { EChatType, IChat } from '@/models/schemas/chat.schema';
import { EChatMemberRole, IChatMember } from '@/models/schemas/chatMember.schema';
import { ObjectId } from 'mongodb';

export interface ChatMemberRowDTO {
  userId: string;
  role: EChatMemberRole;
  joinedAt: string;
  lastReadMessageId?: string | null;
  lastReadAt?: string | null;
}

export interface ChatSummaryResponseDTO {
  id: string;
  type: EChatType;
  createdBy: string;
  name?: string;
  avatarMediaId?: string | null;
  peerUserId?: string;
  updatedAt: string;
  createdAt: string;
}

export interface ChatDetailResponseDTO extends ChatSummaryResponseDTO {
  members: ChatMemberRowDTO[];
}

export function toChatSummary(chat: IChat, peerUserId?: ObjectId): ChatSummaryResponseDTO {
  const base: ChatSummaryResponseDTO = {
    id: chat._id.toHexString(),
    type: chat.type,
    createdBy: chat.createdBy.toHexString(),
    name: chat.name,
    avatarMediaId: chat.avatarMediaId?.toHexString() ?? null,
    updatedAt: chat.updatedAt.toISOString(),
    createdAt: chat.createdAt.toISOString()
  };
  if (peerUserId) {
    base.peerUserId = peerUserId.toHexString();
  }
  return base;
}

export function toMemberRow(m: IChatMember): ChatMemberRowDTO {
  return {
    userId: m.userId.toHexString(),
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    lastReadMessageId: m.lastReadMessageId?.toHexString() ?? null,
    lastReadAt: m.lastReadAt?.toISOString() ?? null
  };
}
