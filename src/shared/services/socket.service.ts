import { getCorsAllowedOrigins } from '@/config';
import { chatRoom, SOCKET_SERVER_CHAT_MESSAGE_NEW, SOCKET_SERVER_CHAT_READ_UPDATED, userRoom } from '@/constants';
import { ChatMessageResponseDTO, IRealtimeChatEmitter, IUsersService } from '@/modules';
import { ITokenService } from '@/shared';
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createSocketAuthResolver, SocketContext, SocketFeature } from './socket';

export interface ISocketService extends IRealtimeChatEmitter {
  run(): void;
  emitToUser(userId: string, event: string, data: unknown): void;
}

export class SocketService implements ISocketService {
  private io: Server;
  private readonly tokenService: ITokenService;
  private readonly features: SocketFeature[];
  private readonly auth: ReturnType<typeof createSocketAuthResolver>;

  constructor(
    httpServer: HttpServer,
    deps: {
      tokenService: ITokenService;
      usersService: IUsersService;
      features: SocketFeature[];
    }
  ) {
    this.io = new Server(httpServer, {
      cors: {
        origin: getCorsAllowedOrigins(),
        credentials: true
      }
    });

    this.tokenService = deps.tokenService;
    this.features = deps.features;
    this.auth = createSocketAuthResolver(deps.usersService, this.tokenService);
  }

  public run() {
    this.io.use(this.auth.handshake);
    this.io.on('connection', (socket) => void this.onConnection(socket));
  }

  private async onConnection(socket: Socket): Promise<void> {
    const ctx: SocketContext = await this.auth.resolveContext(socket);

    socket.join(userRoom(ctx.userId));

    // Middleware to verify accessToken per event
    socket.use((_event, next) => this.auth.perEvent(socket, next));

    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect();
      }
    });

    for (const feature of this.features) {
      feature.mount(this.io, socket, ctx);
    }
  }

  /** Deliver personal events (e.g. Phase 5 `notification:new`) to all tabs in `user:<userId>`. */
  public emitToUser(userId: string, event: string, data: unknown): void {
    this.io.to(userRoom(userId)).emit(event, data);
  }

  public emitMessageCreated(conversationId: string, memberUserIds: string[], message: ChatMessageResponseDTO): void {
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
