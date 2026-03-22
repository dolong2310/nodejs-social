import type { ChatMessageResponseDTO } from '@/dtos/responses/chatMessage.response.dto';

export interface IRealtimeChatEmitter {
  emitMessageCreated(chatIdHex: string, memberUserIdHexes: string[], message: ChatMessageResponseDTO): void;
  emitReadUpdated(
    chatIdHex: string,
    memberUserIdHexes: string[],
    viewerUserIdHex: string,
    payload: { lastReadMessageId: string; lastReadAt: string }
  ): void;
}
