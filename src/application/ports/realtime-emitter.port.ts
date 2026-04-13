import { ChatMessageResultDTO } from '@/application/dtos/chat-message/chat-message.result.dto';

export interface IRealtimeChatEmitter {
  emitToUser(userId: string, event: string, data: unknown): void;
  emitMessageCreated(conversationId: string, memberUserIds: string[], message: ChatMessageResultDTO): void;
  emitReadUpdated(
    conversationId: string,
    memberUserIds: string[],
    viewerUserId: string,
    payload: { lastReadMessageId: string; lastReadAt: string }
  ): void;
}
