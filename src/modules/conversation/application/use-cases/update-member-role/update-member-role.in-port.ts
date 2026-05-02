import { UseCase } from '@/modules/core/application/base.usecase';
import {
  ConversationMemberFullProps,
  EConversationMemberRole
} from '@/modules/conversation/domain/entities/conversation-member.type';
import { ConversationFullProps, EConversationType } from '@/modules/conversation/domain/entities/conversation.type';

export class UpdateMemberRoleCommand {
  userId: string;
  conversationId: string;
  targetUserId: string;
  role: EConversationMemberRole;
  constructor(payload: {
    userId: string;
    conversationId: string;
    targetUserId: string;
    role: EConversationMemberRole;
  }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
    this.targetUserId = payload.targetUserId;
    this.role = payload.role;
  }
}

export class UpdateMemberRoleResult implements Omit<ConversationFullProps, 'userIdLow' | 'userIdHigh'> {
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

export abstract class UpdateMemberRoleInPort implements UseCase<UpdateMemberRoleCommand, UpdateMemberRoleResult> {
  abstract execute(command: UpdateMemberRoleCommand): Promise<UpdateMemberRoleResult>;
}
