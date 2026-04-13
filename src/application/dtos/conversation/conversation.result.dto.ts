import { ICursorPaginationResult } from '@/application/common/interfaces/cursor-pagination-result.interface';
import { EConversationMemberRole } from '@/domain/enums/conversation-member.enum';
import { EConversationType } from '@/domain/enums/conversation.enum';

export class ConversationResultDTO {
  id: string;
  type: EConversationType;
  createdBy: string;
  name?: string;
  avatarMediaId?: string | null;
  peerUserId?: string;
  updatedAt: string;
  createdAt: string;
  constructor(payload: {
    id: string;
    type: EConversationType;
    createdBy: string;
    name?: string;
    avatarMediaId?: string | null;
    peerUserId?: string;
    updatedAt: string;
    createdAt: string;
  }) {
    this.id = payload.id;
    this.type = payload.type;
    this.createdBy = payload.createdBy;
    this.name = payload.name;
    this.avatarMediaId = payload.avatarMediaId;
    this.peerUserId = payload.peerUserId;
    this.updatedAt = payload.updatedAt;
    this.createdAt = payload.createdAt;
  }
}

export class ConversationsPaginationResultDTO implements ICursorPaginationResult<ConversationResultDTO> {
  items: ConversationResultDTO[];
  nextCursor: string | null;
  constructor(items: ConversationResultDTO[], nextCursor: string | null) {
    this.items = items;
    this.nextCursor = nextCursor;
  }
}

export class ConversationDetailResultDTO extends ConversationResultDTO {
  members: ConversationMemberRowDTO[];
  constructor(payload: {
    id: string;
    type: EConversationType;
    createdBy: string;
    name?: string;
    avatarMediaId?: string | null;
    peerUserId?: string;
    updatedAt: string;
    createdAt: string;
    members: ConversationMemberRowDTO[];
  }) {
    super(payload);
    this.members = payload.members;
  }
}

interface ConversationMemberRowDTO {
  userId: string;
  role: EConversationMemberRole;
  joinedAt: string;
  lastReadMessageId?: string | null;
  lastReadAt?: string | null;
}
