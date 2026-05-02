import { UseCase } from '@/modules/core/application/base.usecase';
import { ChatMessageFullProps, IChatAttachment } from '@/modules/conversation/domain/entities/chat-message.type';

export class SendMessageCommand {
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

export class SendMessageResult implements ChatMessageFullProps {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  attachments?: IChatAttachment[];
  createdAt: Date;
  updatedAt: Date;
  constructor(payload: {
    id: string;
    conversationId: string;
    senderId: string;
    text?: string;
    attachments?: IChatAttachment[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = payload.id;
    this.conversationId = payload.conversationId;
    this.senderId = payload.senderId;
    this.text = payload.text;
    this.attachments = payload.attachments;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
  }
}

export abstract class SendMessageInPort implements UseCase<SendMessageCommand, SendMessageResult> {
  abstract execute(command: SendMessageCommand): Promise<SendMessageResult>;
}
