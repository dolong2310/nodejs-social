import { ChatMessageFullProps, IChatAttachment } from '@/modules/conversation/domain/entities/chat-message.type';

export class ChatMessageResponseDTO implements ChatMessageFullProps {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  attachments?: IChatAttachment[];
  createdAt: Date;
  updatedAt: Date;

  constructor(message: ChatMessageFullProps) {
    this.id = message.id;
    this.conversationId = message.conversationId;
    this.senderId = message.senderId;
    this.text = message.text;
    this.attachments = message.attachments;
    this.createdAt = message.createdAt;
    this.updatedAt = message.updatedAt;
  }
}
