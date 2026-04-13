import {
  chatRoom,
  SOCKET_SERVER_CHAT_MESSAGE_NEW,
  SOCKET_SERVER_CHAT_READ_UPDATED,
  userRoom
} from '@/application/common/constants/socket.constant';
import { ChatMessageResultDTO } from '@/application/dtos/chat-message/chat-message.result.dto';
import { IRealtimeChatEmitter } from '@/application/ports/realtime-emitter.port';
import { ISocketContext, ISocketFeature } from '@/application/ports/socket.port';
import { ITokenService } from '@/application/ports/token.port';
import { IUsersService } from '@/application/ports/user.port';

import { SocketIOConnection, SocketIOServer } from '@/infrastructure/socket/socket.adapter';
import { createSocketAuthResolver } from '@/infrastructure/socket/socket.auth';

import { IAppConfig } from '@/bootstrap/types/app.type';

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

export class SocketService implements IRealtimeChatEmitter {
  private io: Server;
  private readonly serverAdapter: SocketIOServer;
  private readonly tokenService: ITokenService;
  private readonly features: ISocketFeature[];
  private readonly auth: ReturnType<typeof createSocketAuthResolver>;

  constructor(
    httpServer: HttpServer,
    appConfig: IAppConfig,
    deps: {
      tokenService: ITokenService;
      usersService: IUsersService;
      features: ISocketFeature[];
    }
  ) {
    this.io = new Server(httpServer, {
      cors: appConfig.cors
    });
    this.serverAdapter = new SocketIOServer(this.io);

    this.tokenService = deps.tokenService;
    this.features = deps.features;
    this.auth = createSocketAuthResolver(deps.usersService, this.tokenService);
  }

  public run() {
    this.io.use(this.auth.handshake);
    this.io.on('connection', (socket) => void this.onConnection(socket));
  }

  private async onConnection(socket: Socket): Promise<void> {
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
  }

  /** Deliver personal events (e.g. Phase 5 `notification:new`) to all tabs in `user:<userId>`. */
  public emitToUser(userId: string, event: string, data: unknown): void {
    this.io.to(userRoom(userId)).emit(event, data);
  }

  public emitMessageCreated(conversationId: string, memberUserIds: string[], message: ChatMessageResultDTO): void {
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
