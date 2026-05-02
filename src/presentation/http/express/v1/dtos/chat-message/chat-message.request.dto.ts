import { IChatAttachment } from '@/modules/conversation/domain/entities/chat-message.type';

export class SendChatMessageBodyDTO {
  text?: string;
  attachments?: IChatAttachment[];

  constructor(body: { text?: string; attachments?: IChatAttachment[] }) {
    this.text = body.text;
    this.attachments = body.attachments;
  }
}

export class MarkChatReadBodyDTO {
  lastReadMessageId?: string;

  constructor(body: { lastReadMessageId?: string }) {
    this.lastReadMessageId = body.lastReadMessageId;
  }
}
