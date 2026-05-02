import { UseCase } from '@/modules/core/application/base.usecase';
import { ConversationMemberFullProps } from '@/modules/conversation/domain/entities/conversation-member.type';
import { ConversationFullProps, EConversationType } from '@/modules/conversation/domain/entities/conversation.type';

export class GetConversationDetailQuery {
  userId: string;
  conversationId: string;
  constructor(payload: { userId: string; conversationId: string }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
  }
}

export class GetConversationDetailResult implements Omit<ConversationFullProps, 'userIdLow' | 'userIdHigh'> {
  id: string;
  type: EConversationType;
  createdBy: string;
  name?: string;
  avatarMediaId?: string | null;
  peerUserId?: string;
  updatedAt: Date;
  createdAt: Date;
  members: ConversationMemberFullProps[];
  constructor(payload: {
    id: string;
    type: EConversationType;
    createdBy: string;
    name?: string;
    avatarMediaId?: string | null;
    peerUserId?: string;
    updatedAt: Date;
    createdAt: Date;
    members: ConversationMemberFullProps[];
  }) {
    this.id = payload.id;
    this.type = payload.type;
    this.createdBy = payload.createdBy;
    this.name = payload.name;
    this.avatarMediaId = payload.avatarMediaId;
    this.peerUserId = payload.peerUserId;
    this.updatedAt = payload.updatedAt;
    this.createdAt = payload.createdAt;
    this.members = payload.members;
  }
}

export abstract class GetConversationDetailInPort implements UseCase<
  GetConversationDetailQuery,
  GetConversationDetailResult
> {
  abstract execute(query: GetConversationDetailQuery): Promise<GetConversationDetailResult>;
}
