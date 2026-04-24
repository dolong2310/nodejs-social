import {
  SOCKET_CLIENT_CHAT_SUBSCRIBE,
  SOCKET_CLIENT_CHAT_TYPING,
  SOCKET_CLIENT_CHAT_UNSUBSCRIBE,
  SOCKET_ROOM_CHAT_PREFIX,
  SOCKET_SERVER_PRESENCE_CHAT,
  chatRoom
} from '@/application/common/constants/socket.constant';
import { ISocketConnection, ISocketContext, ISocketFeature, ISocketServer } from '@/application/ports/socket.port';
import { GetConversationPresenceInPort } from '@/application/use-cases/realtime/get-conversation-presence/get-conversation-presence.in-port';
import { JoinConversationInPort } from '@/application/use-cases/realtime/join-conversation/join-conversation.in-port';
import { LeaveConversationInPort } from '@/application/use-cases/realtime/leave-conversation/leave-conversation.in-port';
import { TypingInPort } from '@/application/use-cases/realtime/typing/typing.in-port';

export class ChatFeature implements ISocketFeature {
  constructor(
    private readonly joinUC: JoinConversationInPort,
    private readonly leaveUC: LeaveConversationInPort,
    private readonly typingUC: TypingInPort,
    private readonly presenceUC: GetConversationPresenceInPort
  ) {}

  mount(server: ISocketServer, socket: ISocketConnection, ctx: ISocketContext): void {
    socket.on(SOCKET_CLIENT_CHAT_SUBSCRIBE, async (data: { conversationId?: string }) => {
      const res = await this.joinUC.execute({ userId: ctx.userId, conversationId: data?.conversationId });
      if (!res) return;

      socket.join(chatRoom(res.conversationId));

      const userIds = await this.presenceUC.execute({ conversationId: res.conversationId });

      let anyOnline = false;
      for (const userId of userIds) {
        const sockets = await server.fetchSocketsInRoom(`user:${userId}`).catch(() => []);
        if (sockets.length > 0) {
          anyOnline = true;
          break;
        }
      }

      server.to(chatRoom(res.conversationId)).emit(SOCKET_SERVER_PRESENCE_CHAT, {
        conversationId: res.conversationId,
        anyMemberOnline: anyOnline
      });
    });

    socket.on(SOCKET_CLIENT_CHAT_UNSUBSCRIBE, async (data: { conversationId?: string }) => {
      const res = await this.leaveUC.execute({ userId: ctx.userId, conversationId: data?.conversationId });
      if (!res) return;

      socket.leave(chatRoom(res.conversationId));
    });

    socket.on(SOCKET_CLIENT_CHAT_TYPING, async (data: { conversationId?: string; typing?: boolean }) => {
      const res = await this.typingUC.execute({
        userId: ctx.userId,
        conversationId: data?.conversationId,
        typing: data?.typing
      });
      if (!res) return;

      server.to(chatRoom(res.conversationId)).emit(SOCKET_CLIENT_CHAT_TYPING, res);
    });

    socket.onDisconnect(async () => {
      for (const room of socket.rooms) {
        if (!room.startsWith(SOCKET_ROOM_CHAT_PREFIX)) continue;

        const conversationId = room.replace(SOCKET_ROOM_CHAT_PREFIX, '');

        const userIds = await this.presenceUC.execute({ conversationId });

        let anyOnline = false;
        for (const userId of userIds) {
          const sockets = await server.fetchSocketsInRoom(`user:${userId}`).catch(() => []);
          if (sockets.length > 0) {
            anyOnline = true;
            break;
          }
        }

        server.to(chatRoom(conversationId)).emit(SOCKET_SERVER_PRESENCE_CHAT, {
          conversationId,
          anyMemberOnline: anyOnline
        });
      }
    });
  }
}

// import { ConversationMemberEntity } from '@/domain/entities/conversation-member/conversation-member.entity';
// import { isValidId } from '@/domain/helpers/ids';
// import { ConversationMemberRepositoryPort } from '@/domain/repositories/conversation-member/conversation-member.repository';

// import {
//   SOCKET_CLIENT_CHAT_SUBSCRIBE,
//   SOCKET_CLIENT_CHAT_TYPING,
//   SOCKET_CLIENT_CHAT_UNSUBSCRIBE,
//   SOCKET_ROOM_CHAT_PREFIX,
//   SOCKET_SERVER_PRESENCE_CHAT,
//   chatRoom
// } from '@/application/common/constants/socket.constant';
// import { ISocketConnection, ISocketContext, ISocketFeature, ISocketServer } from '@/application/ports/socket.port';

// const TYPING_THROTTLE_MS = 2000;

// /**
//  * class này quản lý join/leave phòng chat Socket.IO, sự kiện đang gõ (có throttle), và một cờ presence đơn giản ("có thành viên nào đang online trong conversation không"), có kiểm tra quyền thành viên trước khi subscribe/typing.
//  * 1. SOCKET_CLIENT_CHAT_SUBSCRIBE
//  * - Nhận conversationId.
//  * - Kiểm tra user hiện tại có trong cuộc trò chuyện không (findMembership).
//  * - Nếu có: socket.join(chatRoom(conversationId)) để nhận event trong phòng đó.
//  * - Gọi emitChatPresenceAggregate để cập nhật trạng thái "có ai online trong chat không" cho mọi người trong phòng.
//  * 2. SOCKET_CLIENT_CHAT_UNSUBSCRIBE
//  * - Tương tự validate + membership, rồi leave khỏi phòng chat.
//  * 3. SOCKET_CLIENT_CHAT_TYPING
//  * - Chỉ xử lý khi typing là boolean.
//  * - Kiểm tra membership.
//  * - Khi typing === true, giới hạn tần suất (throttle 2 giây mỗi cặp userId + conversationId) để tránh spam.
//  * - io.to(chatRoom).emit(...) — broadcast tới mọi socket trong phòng: ai đang gõ, bật/tắt typing.
//  * 4. disconnect
//  * - Với mỗi room mà socket đang ở có prefix SOCKET_ROOM_CHAT_PREFIX, coi phần sau là id chat và gọi lại emitChatPresenceAggregate — cập nhật presence khi có người rời mạng (best-effort, lỗi bị nuốt).
//  * 5. emitChatPresenceAggregate
//  * - Lấy danh sách thành viên cuộc trò chuyện.
//  * - Với từng user, kiểm tra có socket nào trong room user:{userId} không (fetchSockets).
//  * - Nếu ít nhất một thành viên còn online => anyMemberOnline: true.
//  * - Emit SOCKET_SERVER_PRESENCE_CHAT vào phòng chat với conversationId và anyMemberOnline.
//  */
// export class ChatFeature implements ISocketFeature {
//   private readonly typingLastEmit = new Map<string, number>();

//   constructor(private readonly conversationMemberRepository: ConversationMemberRepositoryPort) {}

//   mount(server: ISocketServer, socket: ISocketConnection, ctx: ISocketContext): void {
//     socket.on<{ conversationId?: string }>(SOCKET_CLIENT_CHAT_SUBSCRIBE, async (data) => {
//       const resolved = await this.resolveChatMember(ctx.userId, data?.conversationId);
//       if (!resolved) return;
//       const { convId } = resolved;

//       socket.join(chatRoom(convId));
//       await this.emitChatPresenceAggregate(server, convId);
//     });

//     socket.on<{ conversationId?: string }>(SOCKET_CLIENT_CHAT_UNSUBSCRIBE, async (data) => {
//       const resolved = await this.resolveChatMember(ctx.userId, data?.conversationId);
//       if (!resolved) return;
//       const { convId } = resolved;

//       socket.leave(chatRoom(convId));
//     });

//     socket.on<{ conversationId?: string; typing?: boolean }>(SOCKET_CLIENT_CHAT_TYPING, async (data) => {
//       if (typeof data?.typing !== 'boolean') return;

//       const resolved = await this.resolveChatMember(ctx.userId, data?.conversationId);
//       if (!resolved) return;
//       const { convId } = resolved;

//       if (data.typing) {
//         const key = `${ctx.userId}:${convId}`;
//         const now = Date.now();
//         const last = this.typingLastEmit.get(key) ?? 0;
//         if (now - last < TYPING_THROTTLE_MS) return;
//         this.typingLastEmit.set(key, now);
//       }

//       server.to(chatRoom(convId)).emit(SOCKET_CLIENT_CHAT_TYPING, {
//         conversationId: convId,
//         userId: ctx.userId,
//         typing: data.typing
//       });
//     });

//     socket.onDisconnect(async () => {
//       for (const room of socket.rooms) {
//         if (room.startsWith(SOCKET_ROOM_CHAT_PREFIX)) {
//           const convId = room.slice(SOCKET_ROOM_CHAT_PREFIX.length);
//           if (!isValidId(convId)) continue;
//           await this.emitChatPresenceAggregate(server, convId);
//         }
//       }
//     });
//   }

//   /**
//    * Chuẩn hóa conversationId và xác nhận user là thành viên. Trả về null nếu id không hợp lệ hoặc không có quyền.
//    */
//   private async resolveChatMember(
//     userId: string,
//     conversationId?: string
//   ): Promise<{ convId: string; member: ConversationMemberEntity } | null> {
//     if (!conversationId || !isValidId(conversationId)) return null;
//     const memberEntity: ConversationMemberEntity | null = await this.conversationMemberRepository
//       .findMember({ conversationId, userId })
//       .catch(() => null);
//     if (!memberEntity) return null;
//     return { convId: conversationId, member: memberEntity };
//   }

//   private async emitChatPresenceAggregate(server: ISocketServer, conversationId: string): Promise<void> {
//     const memberEntities: ConversationMemberEntity[] = await this.conversationMemberRepository
//       .listMembers(conversationId)
//       .catch(() => []);

//     let anyMemberOnline = false;

//     for (const memberEntity of memberEntities) {
//       const userId = memberEntity.getProps().userId;
//       const sockets: ISocketConnection[] = await server.fetchSocketsInRoom(`user:${userId}`).catch(() => []);
//       if (sockets.length > 0) {
//         anyMemberOnline = true;
//         break;
//       }
//     }

//     server.to(chatRoom(conversationId)).emit(SOCKET_SERVER_PRESENCE_CHAT, {
//       conversationId,
//       anyMemberOnline
//     });
//   }
// }
