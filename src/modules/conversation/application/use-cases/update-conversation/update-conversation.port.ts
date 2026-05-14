import { ConversationFullProps, EnumConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { UseCase } from '@/modules/core/application/base.usecase';

export class UpdateConversationCommand {
  name?: string;
  avatarMediaId?: string | null;
  userId: string;
  conversationId: string;
  constructor(payload: { name?: string; avatarMediaId?: string | null; userId: string; conversationId: string }) {
    this.name = payload.name;
    this.avatarMediaId = payload.avatarMediaId;
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
  }
}

export class UpdateConversationResult implements Omit<ConversationFullProps, 'userIdLow' | 'userIdHigh'> {
  id: string;
  type: EnumConversationType;
  createdBy: string;
  name?: string;
  avatarMediaId?: string | null;
  peerUserId?: string;
  updatedAt: Date;
  createdAt: Date;
  constructor(payload: {
    id: string;
    type: EnumConversationType;
    createdBy: string;
    name?: string;
    avatarMediaId?: string | null;
    peerUserId?: string;
    updatedAt: Date;
    createdAt: Date;
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

export abstract class UpdateConversationPort implements UseCase<UpdateConversationCommand, UpdateConversationResult> {
  abstract execute(command: UpdateConversationCommand): Promise<UpdateConversationResult>;
}
