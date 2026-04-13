import { IChatAttachment } from '@/domain/entities/chat-message.entity';

import { CursorPaginationQueryDTO } from '@/application/dtos/common/common.payload.dto';

export class SendChatMessagePayloadDTO {
  userId: string;
  conversationId: string;
  text?: string;
  attachments?: IChatAttachment[];
  constructor(payload: { userId: string; conversationId: string; text?: string; attachments?: IChatAttachment[] }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
    this.text = payload.text?.trim();
    this.attachments = payload.attachments;
  }
}

export class ListMessagesPayloadDTO extends CursorPaginationQueryDTO {
  userId: string;
  conversationId: string;
  constructor(payload: { userId: string; conversationId: string; limit: string; cursor?: string }) {
    super({ limit: payload.limit, cursor: payload.cursor });
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
  }
}

export class MarkChatReadPayloadDTO {
  userId: string;
  conversationId: string;
  lastReadMessageId?: string;
  constructor(payload: { userId: string; conversationId: string; lastReadMessageId?: string }) {
    this.userId = payload.userId;
    this.conversationId = payload.conversationId;
    this.lastReadMessageId = payload.lastReadMessageId;
  }
}
