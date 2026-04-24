import { RealtimePort } from '@/application/ports/realtime.port';
import { SendMessageResult } from '@/application/use-cases/chat-message/send-message/send-message.in-port';

/**
 * Forwards to the live SocketService after HTTP bootstrap. No-ops until setEmitter runs.
 */
export class RealtimeEmitter implements RealtimePort {
  private emitter: RealtimePort | null = null;

  setEmitter(emitter: RealtimePort | null): void {
    this.emitter = emitter;
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    this.emitter?.emitToUser(userId, event, data);
  }

  emitMessageCreated(conversationId: string, memberUserIds: string[], message: SendMessageResult): void {
    this.emitter?.emitMessageCreated(conversationId, memberUserIds, message);
  }

  emitReadUpdated(
    conversationId: string,
    memberUserIds: string[],
    viewerUserId: string,
    payload: { lastReadMessageId: string; lastReadAt: string }
  ): void {
    this.emitter?.emitReadUpdated(conversationId, memberUserIds, viewerUserId, payload);
  }
}
