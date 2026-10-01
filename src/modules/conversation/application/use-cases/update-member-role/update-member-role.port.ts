import type {
  ConversationMemberFullProps,
  EnumConversationMemberRole
} from '@/modules/conversation/domain/entities/conversation-member.types';
import type {
  ConversationFullProps,
  EnumConversationType
} from '@/modules/conversation/domain/entities/conversation.types';
import type { UseCase } from '@/modules/core/application/base.usecase';

export class UpdateMemberRoleInputPort {
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

export class UpdateMemberRoleOutputPort implements Omit<ConversationFullProps, 'userIdLow' | 'userIdHigh'> {
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

export abstract class UpdateMemberRolePort implements UseCase<UpdateMemberRoleInputPort, UpdateMemberRoleOutputPort> {
  abstract execute(input: UpdateMemberRoleInputPort): Promise<UpdateMemberRoleOutputPort>;
}
