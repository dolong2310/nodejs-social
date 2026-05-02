import {
  chatRoom,
  SOCKET_SERVER_CHAT_MESSAGE_NEW,
  SOCKET_SERVER_CHAT_READ_UPDATED,
  userRoom
} from '@/modules/common/constants/socket.constant';
import { SendMessageResult } from '@/modules/conversation/application/use-cases/send-message/send-message.in-port';
import { RealtimeEmitterPort } from '@/modules/core/application/ports/realtime-emitter.port';
import { type Server as SocketIOServer } from 'socket.io';

export class RealtimeEmitter implements RealtimeEmitterPort {
  constructor(private readonly io: SocketIOServer) {}

  public emitToUser(userId: string, event: string, data: unknown): void {
    this.io.to(userRoom(userId)).emit(event, data);
  }

  public emitMessageCreated(conversationId: string, memberUserIds: string[], message: SendMessageResult): void {
    const rooms = [chatRoom(conversationId), ...memberUserIds.map((id) => userRoom(id))];
    this.io.to(rooms).emit(SOCKET_SERVER_CHAT_MESSAGE_NEW, { message });
  }

  public emitReadUpdated(
    conversationId: string,
    memberUserIds: string[],
    viewerUserId: string,
    payload: { lastReadMessageId: string; lastReadAt: string }
  ): void {
    const rooms = [chatRoom(conversationId), ...memberUserIds.map((id) => userRoom(id))];
    this.io.to(rooms).emit(SOCKET_SERVER_CHAT_READ_UPDATED, {
      conversationId: conversationId,
      userId: viewerUserId,
      lastReadMessageId: payload.lastReadMessageId,
      lastReadAt: payload.lastReadAt
    });
  }
}
