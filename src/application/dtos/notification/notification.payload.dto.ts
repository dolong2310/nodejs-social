import { IChatMessage } from '@/domain/entities/chat-message.entity';
import { IConversation } from '@/domain/entities/conversation.entity';

import { CursorPaginationQueryDTO } from '@/application/dtos/common/common.payload.dto';

export class ListForViewerPayloadDTO extends CursorPaginationQueryDTO {
  viewerId: string;
  unreadOnly?: boolean;
  constructor(payload: { viewerId: string; unreadOnly?: boolean; limit: string; cursor?: string }) {
    super({ limit: payload.limit, cursor: payload.cursor });
    this.viewerId = payload.viewerId;
    this.unreadOnly = payload.unreadOnly;
  }
}

export class MarkReadPayloadDTO {
  viewerId: string;
  ids?: string[];
  constructor(payload: { viewerId: string; ids?: string[] }) {
    this.viewerId = payload.viewerId;
    this.ids = payload.ids;
  }
}

export class MarkSingleReadPayloadDTO {
  viewerId: string;
  notificationId: string;
  constructor(payload: { viewerId: string; notificationId: string }) {
    this.viewerId = payload.viewerId;
    this.notificationId = payload.notificationId;
  }
}

export class RecordFriendRequestPayloadDTO {
  recipientUserId: string;
  fromUserId: string;
  constructor(payload: { recipientUserId: string; fromUserId: string }) {
    this.recipientUserId = payload.recipientUserId;
    this.fromUserId = payload.fromUserId;
  }
}

export class RecordFriendAcceptedPayloadDTO {
  originalRequesterUserId: string;
  accepterUserId: string;
  constructor(payload: { originalRequesterUserId: string; accepterUserId: string }) {
    this.originalRequesterUserId = payload.originalRequesterUserId;
    this.accepterUserId = payload.accepterUserId;
  }
}

export class RecordNewMessagePayloadDTO {
  message: IChatMessage;
  senderUserId: string;
  recipientUserIds: string[];
  constructor(payload: { message: IChatMessage; senderUserId: string; recipientUserIds: string[] }) {
    this.message = payload.message;
    this.senderUserId = payload.senderUserId;
    this.recipientUserIds = payload.recipientUserIds;
  }
}

export class RecordAddedToGroupPayloadDTO {
  inviteeUserId: string;
  inviterUserId: string;
  conv: IConversation;
  constructor(payload: { inviteeUserId: string; inviterUserId: string; conv: IConversation }) {
    this.inviteeUserId = payload.inviteeUserId;
    this.inviterUserId = payload.inviterUserId;
    this.conv = payload.conv;
  }
}
