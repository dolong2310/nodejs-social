import { EConversationMemberRole } from '@/modules/conversations/conversationMember.schema';
import { ParamsDictionary } from 'express-serve-static-core';

export interface ConversationIdParams extends ParamsDictionary {
  conversationId: string;
}

export interface ConversationMemberParams extends ConversationIdParams {
  userId: string;
}

export class CreateDirectConversationBodyDTO {
  peerUserId: string;
  constructor(body: { peerUserId: string }) {
    this.peerUserId = body.peerUserId;
  }
}

export class CreateGroupConversationBodyDTO {
  name?: string;
  memberIds: string[];
  constructor(body: { name?: string; memberIds: string[] }) {
    this.name = body.name;
    this.memberIds = body.memberIds ?? [];
  }
}

export class PatchConversationBodyDTO {
  name?: string;
  avatarMediaId?: string | null;
  constructor(body: { name?: string; avatarMediaId?: string | null }) {
    this.name = body.name;
    this.avatarMediaId = body.avatarMediaId;
  }
}

export class InviteConversationMemberBodyDTO {
  userId: string;
  constructor(body: { userId: string }) {
    this.userId = body.userId;
  }
}

export class PatchConversationMemberRoleBodyDTO {
  role: EConversationMemberRole;
  constructor(body: { role: EConversationMemberRole }) {
    this.role = body.role;
  }
}

export class TransferConversationAdminBodyDTO {
  newAdminUserId: string;
  constructor(body: { newAdminUserId: string }) {
    this.newAdminUserId = body.newAdminUserId;
  }
}
