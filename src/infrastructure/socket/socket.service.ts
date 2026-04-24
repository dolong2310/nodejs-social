import {
  chatRoom,
  SOCKET_SERVER_CHAT_MESSAGE_NEW,
  SOCKET_SERVER_CHAT_READ_UPDATED,
  userRoom
} from '@/application/common/constants/socket.constant';
import { RealtimePort } from '@/application/ports/realtime.port';
import { ISocketContext, ISocketFeature } from '@/application/ports/socket.port';
import { ITokenService } from '@/application/services/token/token.service.type';
import { IUserService } from '@/application/services/user/user.service';
import { SendMessageResult } from '@/application/use-cases/chat-message/send-message/send-message.in-port';
import { IAppConfig } from '@/bootstrap/types/app.type';
import { SocketIOConnection, SocketIOServer } from '@/infrastructure/socket/socket.adapter';
import { createSocketAuthResolver } from '@/infrastructure/socket/socket.auth';
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

export class SocketService implements RealtimePort {
  private io: Server;
  private readonly serverAdapter: SocketIOServer;
  private readonly features: ISocketFeature[];
  private readonly auth: ReturnType<typeof createSocketAuthResolver>;

  constructor(
    httpServer: HttpServer,
    appConfig: IAppConfig,
    deps: {
      tokenService: ITokenService;
      userService: IUserService;
      features: ISocketFeature[];
    }
  ) {
    this.io = new Server(httpServer, {
      cors: appConfig.cors
    });
    this.serverAdapter = new SocketIOServer(this.io);

    this.features = deps.features;
    this.auth = createSocketAuthResolver(deps.userService, deps.tokenService);
  }

  public run() {
    this.io.use(this.auth.handshake);
    this.io.on('connection', async (socket: Socket) => {
      const ctx: ISocketContext = await this.auth.resolveContext(socket);

      socket.join(userRoom(ctx.userId));

      // Middleware to verify accessToken per event
      socket.use((_event, next) => this.auth.perEvent(socket, next));

      socket.on('error', (error) => {
        if (error.message === 'Unauthorized') {
          socket.disconnect();
        }
      });

      const connection = new SocketIOConnection(socket);

      for (const feature of this.features) {
        feature.mount(this.serverAdapter, connection, ctx);
      }
    });
  }

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
