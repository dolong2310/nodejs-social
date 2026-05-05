import { AccessTokenPayload } from '@/modules/auth/application/services/token.service.type';
import {
  SOCKET_CLIENT_CHAT_SUBSCRIBE,
  SOCKET_CLIENT_CHAT_TYPING,
  SOCKET_CLIENT_CHAT_UNSUBSCRIBE,
  SOCKET_ROOM_CHAT_PREFIX,
  SOCKET_SERVER_PRESENCE_CHAT,
  chatRoom
} from '@/modules/common/constants/socket.constant';
import { GetConversationPresencePort } from '@/modules/notification/application/use-cases/realtime/get-conversation-presence/get-conversation-presence.port';
import { JoinConversationPort } from '@/modules/notification/application/use-cases/realtime/join-conversation/join-conversation.port';
import { LeaveConversationPort } from '@/modules/notification/application/use-cases/realtime/leave-conversation/leave-conversation.port';
import { TypingPort } from '@/modules/notification/application/use-cases/realtime/typing/typing.port';
import { ISocketFeature } from '@/presentation/socket/socket.type';
import { Server, Socket } from 'socket.io';

export class ChatFeature implements ISocketFeature {
  constructor(
    private readonly joinUC: JoinConversationPort,
    private readonly leaveUC: LeaveConversationPort,
    private readonly typingUC: TypingPort,
    private readonly presenceUC: GetConversationPresencePort
  ) {}

  /** Kiểm tra song song xem có member nào đang online không */
  private async checkAnyOnline(io: Server, userIds: string[]): Promise<boolean> {
    if (userIds.length === 0) return false;
    const results = await Promise.all(
      userIds.map((userId) =>
        io
          .in(`user:${userId}`)
          .fetchSockets()
          .catch(() => [])
      )
    );
    return results.some((sockets) => sockets.length > 0);
  }

  mount(io: Server, socket: Socket, payload: AccessTokenPayload): void {
    socket.on(SOCKET_CLIENT_CHAT_SUBSCRIBE, async (data: { conversationId?: string }) => {
      const res = await this.joinUC.execute({ userId: payload.userId, conversationId: data?.conversationId });
      if (!res) return;

      socket.join(chatRoom(res.conversationId));

      const userIds = await this.presenceUC.execute({ conversationId: res.conversationId });
      const anyMemberOnline = await this.checkAnyOnline(io, userIds);

      io.to(chatRoom(res.conversationId)).emit(SOCKET_SERVER_PRESENCE_CHAT, {
        conversationId: res.conversationId,
        anyMemberOnline
      });
    });

    socket.on(SOCKET_CLIENT_CHAT_UNSUBSCRIBE, async (data: { conversationId?: string }) => {
      const res = await this.leaveUC.execute({ userId: payload.userId, conversationId: data?.conversationId });
      if (!res) return;

      socket.leave(chatRoom(res.conversationId));
    });

    socket.on(SOCKET_CLIENT_CHAT_TYPING, async (data: { conversationId?: string; typing?: boolean }) => {
      const res = await this.typingUC.execute({
        userId: payload.userId,
        conversationId: data?.conversationId,
        typing: data?.typing
      });
      if (!res) return;

      io.to(chatRoom(res.conversationId)).emit(SOCKET_CLIENT_CHAT_TYPING, res);
    });

    socket.on('disconnect', async () => {
      for (const room of socket.rooms) {
        if (!room.startsWith(SOCKET_ROOM_CHAT_PREFIX)) continue;

        const conversationId = room.replace(SOCKET_ROOM_CHAT_PREFIX, '');
        const userIds = await this.presenceUC.execute({ conversationId });
        const anyMemberOnline = await this.checkAnyOnline(io, userIds);

        io.to(chatRoom(conversationId)).emit(SOCKET_SERVER_PRESENCE_CHAT, {
          conversationId,
          anyMemberOnline
        });
      }
    });
  }
}
