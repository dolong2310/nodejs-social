import { IChatAttachment, IChatMessage } from '@/modules/chatMessages/chatMessages.schema';

export interface ChatMessageResponseDTO {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  attachments?: IChatAttachment[];
  createdAt: string;
}

export function toChatMessageDto(m: IChatMessage): ChatMessageResponseDTO {
  return {
    id: m._id.toHexString(),
    chatId: m.chatId.toHexString(),
    senderId: m.senderId.toHexString(),
    text: m.text,
    attachments: m.attachments,
    createdAt: m.createdAt.toISOString()
  };
}

export interface ChatMessagesPageResponseDTO {
  messages: ChatMessageResponseDTO[];
  nextCursor: string | null;
}
