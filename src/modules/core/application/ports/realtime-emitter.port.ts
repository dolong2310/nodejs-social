import { SendMessageResult } from '@/modules/conversation/application/use-cases/send-message/send-message.port';

export interface RealtimeEmitterPort {
  emitToUser(userId: string, event: string, data: unknown): void;
  emitMessageCreated(conversationId: string, memberUserIds: string[], message: SendMessageResult): void;
  emitReadUpdated(
    conversationId: string,
    memberUserIds: string[],
    viewerUserId: string,
    payload: { lastReadMessageId: string; lastReadAt: string }
  ): void;
}
