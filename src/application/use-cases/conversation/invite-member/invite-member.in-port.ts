import { UseCase } from '@/application/use-cases/base/base.usecase';
import { ConversationMemberFullProps } from '@/domain/entities/conversation-member/conversation-member.type';
import { ConversationFullProps, EConversationType } from '@/domain/entities/conversation/conversation.type';

export class InviteMemberCommand {
  userId: string;
  inviteeUserId: string;
  conversationId: string;
  constructor(payload: { userId: string; inviteeUserId: string; conversationId: string }) {
    this.userId = payload.userId;
    this.inviteeUserId = payload.inviteeUserId;
    this.conversationId = payload.conversationId;
  }
}

export class InviteMemberResult implements Omit<ConversationFullProps, 'userIdLow' | 'userIdHigh'> {
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

export abstract class InviteMemberInPort implements UseCase<InviteMemberCommand, InviteMemberResult> {
  abstract execute(command: InviteMemberCommand): Promise<InviteMemberResult>;
}
