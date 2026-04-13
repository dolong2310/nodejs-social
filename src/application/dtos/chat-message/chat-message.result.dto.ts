import { ICursorPaginationResult } from '@/application/common/interfaces/cursor-pagination-result.interface';
import { IChatAttachment } from '@/domain/entities/chat-message.entity';

export class ChatMessageResultDTO {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  attachments?: IChatAttachment[];
  createdAt: string;
  constructor(payload: {
    id: string;
    conversationId: string;
    senderId: string;
    text?: string;
    attachments?: IChatAttachment[];
    createdAt: string;
  }) {
    this.id = payload.id;
    this.conversationId = payload.conversationId;
    this.senderId = payload.senderId;
    this.text = payload.text;
    this.attachments = payload.attachments;
    this.createdAt = payload.createdAt;
  }
}

export class ChatMessagesPaginationResultDTO implements ICursorPaginationResult<ChatMessageResultDTO> {
  items: ChatMessageResultDTO[];
  nextCursor: string | null;
  constructor(items: ChatMessageResultDTO[], nextCursor: string | null) {
    this.items = items;
    this.nextCursor = nextCursor;
  }
}
