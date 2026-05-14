import { ConversationMemberFullProps } from '@/modules/conversation/domain/entities/conversation-member.type';
import { ConversationFullProps, EnumConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { UseCase } from '@/modules/core/application/base.usecase';

export class TransferAdminCommand {
  userId: string;
  newAdminUserId: string;
  conversationId: string;
  constructor(payload: { userId: string; newAdminUserId: string; conversationId: string }) {
    this.userId = payload.userId;
    this.newAdminUserId = payload.newAdminUserId;
    this.conversationId = payload.conversationId;
  }
}

export class TransferAdminResult implements Omit<ConversationFullProps, 'userIdLow' | 'userIdHigh'> {
  id: string;
  type: EnumConversationType;
  createdBy: string;
  name?: string;
  avatarMediaId?: string | null;
  peerUserId?: string;
  updatedAt: Date;
  createdAt: Date;
  members: ConversationMemberFullProps[];
  constructor(payload: {
    id: string;
    type: EnumConversationType;
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

export abstract class TransferAdminPort implements UseCase<TransferAdminCommand, TransferAdminResult> {
  abstract execute(command: TransferAdminCommand): Promise<TransferAdminResult>;
}
