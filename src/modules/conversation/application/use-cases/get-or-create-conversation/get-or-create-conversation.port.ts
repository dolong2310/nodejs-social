import { ConversationFullProps, EnumConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { UseCase } from '@/modules/core/application/base.usecase';

export class GetOrCreateConversationCommand {
  userId: string;
  peerUserId: string;
  constructor(payload: { userId: string; peerUserId: string }) {
    this.userId = payload.userId;
    this.peerUserId = payload.peerUserId;
  }
}

export class GetOrCreateConversationResult implements Omit<ConversationFullProps, 'userIdLow' | 'userIdHigh'> {
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

export abstract class GetOrCreateConversationPort implements UseCase<
  GetOrCreateConversationCommand,
  GetOrCreateConversationResult
> {
  abstract execute(command: GetOrCreateConversationCommand): Promise<GetOrCreateConversationResult>;
}
