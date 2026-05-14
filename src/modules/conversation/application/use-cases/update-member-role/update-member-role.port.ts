import {
  ConversationMemberFullProps,
  EnumConversationMemberRole
} from '@/modules/conversation/domain/entities/conversation-member.type';
import { ConversationFullProps, EnumConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { UseCase } from '@/modules/core/application/base.usecase';

export class UpdateMemberRoleCommand {
  userId: string;
  conversationId: string;
  targetUserId: string;
  role: EnumConversationMemberRole;
  constructor(payload: {
    userId: string;
    conversationId: string;
    targetUserId: string;
    role: EnumConversationMemberRole;
  }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
    this.targetUserId = payload.targetUserId;
    this.role = payload.role;
  }
}

export class UpdateMemberRoleResult implements Omit<ConversationFullProps, 'userIdLow' | 'userIdHigh'> {
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

export abstract class UpdateMemberRolePort implements UseCase<UpdateMemberRoleCommand, UpdateMemberRoleResult> {
  abstract execute(command: UpdateMemberRoleCommand): Promise<UpdateMemberRoleResult>;
}
