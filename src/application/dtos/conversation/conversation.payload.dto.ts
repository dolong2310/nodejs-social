import { EConversationMemberRole } from '@/domain/enums/conversation-member.enum';

import { CursorPaginationQueryDTO } from '@/application/dtos/common/common.payload.dto';

export class GetOrCreateDirectPayloadDTO {
  userId: string;
  peerUserId: string;
  constructor(payload: { userId: string; peerUserId: string }) {
    this.userId = payload.userId;
    this.peerUserId = payload.peerUserId;
  }
}

export class CreateGroupConversationPayloadDTO {
  userId: string;
  name?: string;
  memberIds: string[];
  constructor(payload: { userId: string; name?: string; memberIds: string[] }) {
    this.userId = payload.userId;
    this.name = payload.name;
    this.memberIds = payload.memberIds ?? [];
  }
}

export class ListConversationsPayloadDTO extends CursorPaginationQueryDTO {
  userId: string;
  constructor(payload: { userId: string; limit: string; cursor?: string }) {
    super({ limit: payload.limit, cursor: payload.cursor });
    this.userId = payload.userId;
  }
}

export class GetConversationDetailPayloadDTO {
  userId: string;
  conversationId: string;
  constructor(payload: { userId: string; conversationId: string }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
  }
}

export class PatchConversationPayloadDTO {
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

export class InviteConversationMemberPayloadDTO {
  userId: string;
  inviteeUserId: string;
  conversationId: string;
  constructor(payload: { userId: string; inviteeUserId: string; conversationId: string }) {
    this.userId = payload.userId;
    this.inviteeUserId = payload.inviteeUserId;
    this.conversationId = payload.conversationId;
  }
}

export class LeaveConversationPayloadDTO {
  userId: string;
  conversationId: string;
  constructor(payload: { userId: string; conversationId: string }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
  }
}

export class KickMemberPayloadDTO {
  userId: string;
  conversationId: string;
  targetUserId: string;
  constructor(payload: { userId: string; conversationId: string; targetUserId: string }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
    this.targetUserId = payload.targetUserId;
  }
}

export class PatchConversationMemberRolePayloadDTO {
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

export class TransferConversationAdminPayloadDTO {
  userId: string;
  newAdminUserId: string;
  conversationId: string;
  constructor(payload: { userId: string; newAdminUserId: string; conversationId: string }) {
    this.userId = payload.userId;
    this.newAdminUserId = payload.newAdminUserId;
    this.conversationId = payload.conversationId;
  }
}
