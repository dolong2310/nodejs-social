import { EChatMemberRole } from '@/models/schemas/chatMember.schema';
import { ParamsDictionary } from 'express-serve-static-core';

export interface ChatIdParams extends ParamsDictionary {
  chatId: string;
}

export interface ChatMemberParams extends ChatIdParams {
  userId: string;
}

export class CreateDirectChatBodyDTO {
  peerUserId: string;
  constructor(body: { peerUserId: string }) {
    this.peerUserId = body.peerUserId;
  }
}

export class CreateGroupChatBodyDTO {
  name?: string;
  memberIds: string[];
  constructor(body: { name?: string; memberIds: string[] }) {
    this.name = body.name;
    this.memberIds = body.memberIds ?? [];
  }
}

export class PatchChatBodyDTO {
  name?: string;
  avatarMediaId?: string | null;
  constructor(body: { name?: string; avatarMediaId?: string | null }) {
    this.name = body.name;
    this.avatarMediaId = body.avatarMediaId;
  }
}

export class InviteChatMemberBodyDTO {
  userId: string;
  constructor(body: { userId: string }) {
    this.userId = body.userId;
  }
}

export class PatchChatMemberRoleBodyDTO {
  role: EChatMemberRole;
  constructor(body: { role: EChatMemberRole }) {
    this.role = body.role;
  }
}

export class TransferChatAdminBodyDTO {
  newAdminUserId: string;
  constructor(body: { newAdminUserId: string }) {
    this.newAdminUserId = body.newAdminUserId;
  }
}
