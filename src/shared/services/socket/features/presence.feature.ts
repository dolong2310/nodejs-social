import { SOCKET_SERVER_PRESENCE_USER, userRoom } from '@/constants';
import { IFriendshipRepository } from '@/modules';
import { Server, Socket } from 'socket.io';
import { SocketFeature } from '../socket.feature';
import { SocketContext } from '../socket.types';

/**
 * Class này đồng bộ trạng thái “có mặt” của user với bạn bè qua Socket.IO, và tránh báo offline sớm khi cùng user vẫn còn ít nhất một kết nối khác.
 * - Khi user kết nối (mount)
 * 1. Lấy danh sách userId bạn bè từ friendshipRepository.findFriendUserIdsForUser(ctx.userId).
 * 2. Với mỗi bạn, gửi tới room user:{friendId} (hàm userRoom) payload { userId: ctx.userId, online: true }.
 * ==> Bạn bè đang lắng nghe room của chính họ sẽ biết user này vừa online.
 * - Khi socket disconnect
 * 1. Kiểm tra trong room user:{ctx.userId} còn socket nào khác không (fetchSockets()).
 * 2. Nếu còn (ví dụ cùng tài khoản mở nhiều tab/thiết bị) → không báo offline.
 * 3. Nếu không còn socket nào → coi như user thật sự offline, lại lấy danh sách bạn và emit { userId, online: false } tới từng bạn.
 */
export class PresenceFeature implements SocketFeature {
  constructor(private readonly friendshipRepository: IFriendshipRepository) {}

  mount(io: Server, socket: Socket, ctx: SocketContext): void {
    void (async () => {
      try {
        const friends = await this.friendshipRepository.findFriendUserIdsForUser(ctx.userId);
        for (const f of friends) {
          io.to(userRoom(f)).emit(SOCKET_SERVER_PRESENCE_USER, {
            userId: ctx.userId,
            online: true
          });
        }
      } catch {
        /* presence best-effort */
      }
    })();

    socket.on('disconnect', () => {
      void (async () => {
        try {
          const remaining = await io.in(userRoom(ctx.userId)).fetchSockets();
          if (remaining.length !== 0) return;

          const friends = await this.friendshipRepository.findFriendUserIdsForUser(ctx.userId);
          for (const f of friends) {
            io.to(userRoom(f)).emit(SOCKET_SERVER_PRESENCE_USER, {
              userId: ctx.userId,
              online: false
            });
          }
        } catch {
          /* presence best-effort */
        }
      })();
    });
  }
}
