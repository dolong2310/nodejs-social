import type { ChatMessageResponseDTO } from '@/dtos/responses/chatMessage.response.dto';

export interface IRealtimeChatEmitter {
  emitMessageCreated(conversationIdHex: string, memberUserIdHexes: string[], message: ChatMessageResponseDTO): void;
  emitReadUpdated(
    conversationIdHex: string,
    memberUserIdHexes: string[],
    viewerUserIdHex: string,
    payload: { lastReadMessageId: string; lastReadAt: string }
  ): void;
}
