import {
  SOCKET_CLIENT_CHAT_SUBSCRIBE,
  SOCKET_CLIENT_CHAT_TYPING,
  SOCKET_CLIENT_CHAT_UNSUBSCRIBE,
  SOCKET_ROOM_CHAT_PREFIX,
  SOCKET_SERVER_PRESENCE_CHAT,
  chatRoom
} from '@/constants';
import { IConversationMemberRepository } from '@/modules';
import { Server, Socket } from 'socket.io';
import { SocketFeature } from '../socket.feature';
import { SocketContext } from '../socket.types';

const TYPING_THROTTLE_MS = 2000;

function isObjectIdHex(s: string): boolean {
  return typeof s === 'string' && /^[a-fA-F0-9]{24}$/.test(s);
}

/**
 * class này quản lý join/leave phòng chat Socket.IO, sự kiện đang gõ (có throttle), và một cờ presence đơn giản (“có thành viên nào đang online trong conversation không”), có kiểm tra quyền thành viên trước khi subscribe/typing.
 * 1. SOCKET_CLIENT_CHAT_SUBSCRIBE
 * - Nhận conversationId (chuỗi 24 ký tự hex như Mongo ObjectId).
 * - Kiểm tra user hiện tại có trong cuộc trò chuyện không (findMembership).
 * - Nếu có: socket.join(chatRoom(conversationId)) để nhận event trong phòng đó.
 * - Gọi emitChatPresenceAggregate để cập nhật trạng thái “có ai online trong chat không” cho mọi người trong phòng.
 * 2. SOCKET_CLIENT_CHAT_UNSUBSCRIBE
 * - Tương tự validate + membership, rồi leave khỏi phòng chat.
 * 3. SOCKET_CLIENT_CHAT_TYPING
 * - Chỉ xử lý khi typing là boolean.
 * - Kiểm tra membership.
 * - Khi typing === true, giới hạn tần suất (throttle 2 giây mỗi cặp userId + conversationId) để tránh spam.
 * - io.to(chatRoom).emit(...) — broadcast tới mọi socket trong phòng: ai đang gõ, bật/tắt typing.
 * 4. disconnect
 * - Với mỗi room mà socket đang ở có prefix SOCKET_ROOM_CHAT_PREFIX, coi phần sau là id chat và gọi lại emitChatPresenceAggregate — cập nhật presence khi có người rời mạng (best-effort, lỗi bị nuốt).
 * 5. emitChatPresenceAggregate
 * - Lấy danh sách thành viên cuộc trò chuyện.
 * - Với từng user, kiểm tra có socket nào trong room user:{userId} không (fetchSockets).
 * - Nếu ít nhất một thành viên còn online → anyMemberOnline: true.
 * - Emit SOCKET_SERVER_PRESENCE_CHAT vào phòng chat với conversationId và anyMemberOnline.
 */
export class ChatFeature implements SocketFeature {
  private readonly typingLastEmit = new Map<string, number>();

  constructor(private readonly conversationMemberRepository: IConversationMemberRepository) {}

  mount(io: Server, socket: Socket, ctx: SocketContext): void {
    socket.on(SOCKET_CLIENT_CHAT_SUBSCRIBE, async (data: { conversationId?: string }) => {
      const convId = data?.conversationId;
      if (!convId || typeof convId !== 'string' || !isObjectIdHex(convId)) return;

      const member = await this.conversationMemberRepository.findMembership(convId, ctx.userId);
      if (!member) return;

      socket.join(chatRoom(convId));
      void this.emitChatPresenceAggregate(io, convId);
    });

    socket.on(SOCKET_CLIENT_CHAT_UNSUBSCRIBE, (data: { conversationId?: string }) => {
      const convId = data?.conversationId;
      if (!convId || typeof convId !== 'string' || !isObjectIdHex(convId)) return;

      void (async () => {
        const member = await this.conversationMemberRepository.findMembership(convId, ctx.userId);
        if (!member) return;
        socket.leave(chatRoom(convId));
      })();
    });

    socket.on(SOCKET_CLIENT_CHAT_TYPING, async (data: { conversationId?: string; typing?: boolean }) => {
      const convId = data?.conversationId;
      if (!convId || typeof convId !== 'string' || !isObjectIdHex(convId)) return;
      if (typeof data?.typing !== 'boolean') return;
      const typing = data.typing;

      const member = await this.conversationMemberRepository.findMembership(convId, ctx.userId);
      if (!member) return;

      if (typing) {
        const key = `${ctx.userId}:${convId}`;
        const now = Date.now();
        const last = this.typingLastEmit.get(key) ?? 0;
        if (now - last < TYPING_THROTTLE_MS) {
          return;
        }
        this.typingLastEmit.set(key, now);
      }

      io.to(chatRoom(convId)).emit(SOCKET_CLIENT_CHAT_TYPING, {
        conversationId: convId,
        userId: ctx.userId,
        typing
      });
    });

    socket.on('disconnect', () => {
      void (async () => {
        try {
          for (const room of socket.rooms) {
            if (room.startsWith(SOCKET_ROOM_CHAT_PREFIX)) {
              const convId = room.slice(SOCKET_ROOM_CHAT_PREFIX.length);
              await this.emitChatPresenceAggregate(io, convId);
            }
          }
        } catch {
          /* best-effort */
        }
      })();
    });
  }

  private async emitChatPresenceAggregate(io: Server, convId: string): Promise<void> {
    if (!isObjectIdHex(convId)) return;

    const members = await this.conversationMemberRepository.listMembers(convId);
    let anyMemberOnline = false;
    for (const member of members) {
      const userId = member.userId.toHexString();
      const sockets = await io.in(`user:${userId}`).fetchSockets();
      if (sockets.length > 0) {
        anyMemberOnline = true;
        break;
      }
    }

    io.to(chatRoom(convId)).emit(SOCKET_SERVER_PRESENCE_CHAT, {
      conversationId: convId,
      anyMemberOnline
    });
  }
}
