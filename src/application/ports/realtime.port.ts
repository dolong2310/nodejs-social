import { SendMessageResult } from '@/application/use-cases/chat-message/send-message/send-message.in-port';

export interface RealtimePort {
  emitToUser(userId: string, event: string, data: unknown): void;
  emitMessageCreated(conversationId: string, memberUserIds: string[], message: SendMessageResult): void;
  emitReadUpdated(
    conversationId: string,
    memberUserIds: string[],
    viewerUserId: string,
    payload: { lastReadMessageId: string; lastReadAt: string }
  ): void;
}
