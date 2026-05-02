import { AccessTokenPayload } from '@/modules/auth/application/services/token.service.type';
import { SOCKET_SERVER_PRESENCE_USER, userRoom } from '@/modules/common/constants/socket.constant';
import { NotifyFriendsOfflineInPort } from '@/modules/notification/application/use-cases/realtime/notify-friends-offline/notify-friends-offline.in-port';
import { NotifyFriendsOnlineInPort } from '@/modules/notification/application/use-cases/realtime/notify-friends-online/notify-friends-online.in-port';
import { ISocketFeature } from '@/presentation/socket/socket.type';
import { Server, Socket } from 'socket.io';

export class PresenceFeature implements ISocketFeature {
  constructor(
    private readonly onlineUC: NotifyFriendsOnlineInPort,
    private readonly offlineUC: NotifyFriendsOfflineInPort
  ) {}

  mount(io: Server, socket: Socket, payload: AccessTokenPayload): void {
    void (async () => {
      const friendIds = await this.onlineUC.execute({ userId: payload.userId });

      for (const fid of friendIds) {
        io.to(userRoom(fid)).emit(SOCKET_SERVER_PRESENCE_USER, {
          userId: payload.userId,
          online: true
        });
      }
    })();

    socket.on('disconnect', async () => {
      const remaining = await io
        .in(userRoom(payload.userId))
        .fetchSockets()
        .catch(() => []);
      if (remaining.length > 0) return;

      const friendIds = await this.offlineUC.execute({ userId: payload.userId });

      for (const fid of friendIds) {
        io.to(userRoom(fid)).emit(SOCKET_SERVER_PRESENCE_USER, {
          userId: payload.userId,
          online: false
        });
      }
    });
  }
}
