import type { ChatMessageResponseDTO } from '@/modules';

export interface IRealtimeChatEmitter {
  emitMessageCreated(conversationIdHex: string, memberUserIdHexes: string[], message: ChatMessageResponseDTO): void;
  emitReadUpdated(
    conversationIdHex: string,
    memberUserIdHexes: string[],
    viewerUserIdHex: string,
    payload: { lastReadMessageId: string; lastReadAt: string }
  ): void;
}
