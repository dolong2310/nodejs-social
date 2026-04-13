import { IChatAttachment, IChatMessage } from '@/domain/entities/chat-message.entity';

export interface ChatMessageResponseDTO {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  attachments?: IChatAttachment[];
  createdAt: string;
}

export function toChatMessageDto(m: IChatMessage): ChatMessageResponseDTO {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    text: m.text,
    attachments: m.attachments,
    createdAt: m.createdAt.toISOString()
  };
}
