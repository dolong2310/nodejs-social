import { IFriendshipRepository } from '@/domain/repositories/friendship/friendship.repository';

import { SOCKET_SERVER_PRESENCE_USER, userRoom } from '@/application/common/constants/socket.constant';
import { ISocketConnection, ISocketContext, ISocketFeature, ISocketServer } from '@/application/ports/socket.port';

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
export class PresenceFeature implements ISocketFeature {
  constructor(private readonly friendshipRepository: IFriendshipRepository) {}

  mount(server: ISocketServer, socket: ISocketConnection, { userId }: ISocketContext): void {
    void (async () => {
      const friends = await this.friendshipRepository.findFriendIdsByUserId({ userId }).catch(() => []);

      for (const f of friends) {
        server.to(userRoom(f)).emit(SOCKET_SERVER_PRESENCE_USER, {
          userId,
          online: true
        });
      }
    })();

    socket.onDisconnect(async () => {
      const remaining: ISocketConnection[] = await server.fetchSocketsInRoom(userRoom(userId)).catch(() => []);
      if (remaining.length !== 0) return;

      const friends = await this.friendshipRepository.findFriendIdsByUserId({ userId }).catch(() => []);

      for (const f of friends) {
        server.to(userRoom(f)).emit(SOCKET_SERVER_PRESENCE_USER, {
          userId,
          online: false
        });
      }
    });
  }
}
