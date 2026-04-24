import { UseCase } from '@/application/use-cases/base/base.usecase';
import { ConversationFullProps, EConversationType } from '@/domain/entities/conversation/conversation.type';

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
  type: EConversationType;
  createdBy: string;
  name?: string;
  avatarMediaId?: string | null;
  peerUserId?: string;
  updatedAt: Date;
  createdAt: Date;
  constructor(payload: {
    id: string;
    type: EConversationType;
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

export abstract class GetOrCreateConversationInPort implements UseCase<
  GetOrCreateConversationCommand,
  GetOrCreateConversationResult
> {
  abstract execute(command: GetOrCreateConversationCommand): Promise<GetOrCreateConversationResult>;
}
