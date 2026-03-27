import { getCorsAllowedOrigins } from '@/config';
import {
  SOCKET_CLIENT_CHAT_SUBSCRIBE,
  SOCKET_CLIENT_CHAT_TYPING,
  SOCKET_CLIENT_CHAT_UNSUBSCRIBE,
  SOCKET_ROOM_CHAT_PREFIX,
  SOCKET_SERVER_CHAT_MESSAGE_NEW,
  SOCKET_SERVER_CHAT_READ_UPDATED,
  SOCKET_SERVER_PRESENCE_CHAT,
  SOCKET_SERVER_PRESENCE_USER,
  VALIDATION_ERROR_MESSAGE,
  chatRoom,
  userRoom
} from '@/constants';
import { ETokenType, IRealtimeChatEmitter, TokenPayload } from '@/interfaces';
import {
  ChatMessageResponseDTO,
  EUserVerificationStatus,
  IConversationMemberRepository,
  IFriendshipRepository,
  IUsersService
} from '@/modules';
import { AuthFailureError, ForbiddenError, NotFoundError } from '@/providers';
import { ITokenService, TokenService } from '@/shared';
import { Server as HttpServer } from 'http';
import { ObjectId } from 'mongodb';
import { ExtendedError, Server, Socket } from 'socket.io';

export interface ISocketService extends IRealtimeChatEmitter {
  run(): void;
  emitToUser(userId: string, event: string, data: unknown): void;
}

const TYPING_THROTTLE_MS = 2000;

function parseObjectIdHex(hex: string): ObjectId | null {
  if (!hex || typeof hex !== 'string' || !ObjectId.isValid(hex)) {
    return null;
  }
  try {
    return new ObjectId(hex);
  } catch {
    return null;
  }
}

export class SocketService implements ISocketService {
  private io: Server;
  private readonly tokenService: ITokenService;
  private readonly typingLastEmit = new Map<string, number>();

  constructor(
    httpServer: HttpServer,
    private readonly usersService: IUsersService,
    private readonly conversationMemberRepository: IConversationMemberRepository,
    private readonly friendshipRepository: IFriendshipRepository
  ) {
    this.io = new Server(httpServer, {
      cors: {
        origin: getCorsAllowedOrigins(),
        credentials: true
      }
    });

    this.tokenService = new TokenService();
  }

  public run() {
    this.io.use(this.initMiddleware.bind(this));
    this.io.on('connection', this.onConnection.bind(this));
  }

  /** Deliver personal events (e.g. Phase 5 `notification:new`) to all tabs in `user:<userId>`. */
  public emitToUser(userId: string, event: string, data: unknown): void {
    this.io.to(userRoom(userId)).emit(event, data);
  }

  public emitMessageCreated(
    conversationIdHex: string,
    memberUserIdHexes: string[],
    message: ChatMessageResponseDTO
  ): void {
    const rooms = [chatRoom(conversationIdHex), ...memberUserIdHexes.map((id) => userRoom(id))];
    this.io.to(rooms).emit(SOCKET_SERVER_CHAT_MESSAGE_NEW, { message });
  }

  public emitReadUpdated(
    conversationIdHex: string,
    memberUserIdHexes: string[],
    viewerUserIdHex: string,
    payload: { lastReadMessageId: string; lastReadAt: string }
  ): void {
    const rooms = [chatRoom(conversationIdHex), ...memberUserIdHexes.map((id) => userRoom(id))];
    this.io.to(rooms).emit(SOCKET_SERVER_CHAT_READ_UPDATED, {
      conversationId: conversationIdHex,
      userId: viewerUserIdHex,
      lastReadMessageId: payload.lastReadMessageId,
      lastReadAt: payload.lastReadAt
    });
  }

  private async emitChatPresenceAggregate(chatIdHex: string): Promise<void> {
    const cid = parseObjectIdHex(chatIdHex);
    if (!cid) return;

    const members = await this.conversationMemberRepository.listMembers(cid);
    let anyMemberOnline = false;
    for (const m of members) {
      const hex = m.userId.toHexString();
      const sockets = await this.io.in(userRoom(hex)).fetchSockets();
      if (sockets.length > 0) {
        anyMemberOnline = true;
        break;
      }
    }

    this.io.to(chatRoom(chatIdHex)).emit(SOCKET_SERVER_PRESENCE_CHAT, {
      conversationId: chatIdHex,
      anyMemberOnline
    });
  }

  private async initMiddleware(socket: Socket, next: (err?: ExtendedError) => void) {
    try {
      const { Authorization } = socket.handshake.auth;
      const accessToken = Authorization?.split(' ')[1];
      if (!accessToken) {
        throw new AuthFailureError();
      }

      const decoded = await this.tokenService.verifyAccessToken(accessToken);
      if (decoded.type !== ETokenType.ACCESS_TOKEN) {
        throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
      }

      const user = await this.usersService.findUserById(decoded.userId);
      if (!user) {
        throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
      }
      if (user.verificationStatus === EUserVerificationStatus.UNVERIFIED) {
        throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.USER_NOT_VERIFIED_YET);
      }
      if (user.verificationStatus === EUserVerificationStatus.BANNED) {
        throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.USER_IS_BANNED);
      }

      socket.handshake.auth.decoded = decoded;
      socket.handshake.auth.accessToken = accessToken;
      next();
    } catch (error) {
      next({
        message: 'Unauthorized',
        name: 'UnauthorizedError',
        data: error
      });
    }
  }

  private onConnection(socket: Socket) {
    const { userId } = socket.handshake.auth.decoded as TokenPayload;
    const viewerOid = new ObjectId(userId);

    socket.join(userRoom(userId));

    void (async () => {
      try {
        const friends = await this.friendshipRepository.findFriendUserIdsForUser(viewerOid);
        for (const f of friends) {
          this.io.to(userRoom(f.toHexString())).emit(SOCKET_SERVER_PRESENCE_USER, {
            userId,
            online: true
          });
        }
      } catch {
        /* presence best-effort */
      }
    })();

    socket.use(async (_packet, next) => {
      try {
        const { accessToken } = socket.handshake.auth;
        if (!accessToken) {
          throw new AuthFailureError();
        }

        const decoded = await this.tokenService.verifyAccessToken(accessToken);
        if (decoded.type !== ETokenType.ACCESS_TOKEN) {
          throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
        }

        socket.handshake.auth.decoded = decoded;
        socket.handshake.auth.accessToken = accessToken;
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });

    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect();
      }
    });

    socket.on(SOCKET_CLIENT_CHAT_SUBSCRIBE, async (data: { conversationId?: string }) => {
      const raw = data?.conversationId;
      if (!raw || typeof raw !== 'string') return;
      const cid = parseObjectIdHex(raw);
      if (!cid) return;

      const m = await this.conversationMemberRepository.findMembership(cid, viewerOid);
      if (!m) return;

      socket.join(chatRoom(raw));
      void this.emitChatPresenceAggregate(raw);
    });

    socket.on(SOCKET_CLIENT_CHAT_UNSUBSCRIBE, (data: { conversationId?: string }) => {
      const raw = data?.conversationId;
      if (!raw || typeof raw !== 'string') return;
      const cid = parseObjectIdHex(raw);
      if (!cid) return;

      void (async () => {
        const m = await this.conversationMemberRepository.findMembership(cid, viewerOid);
        if (!m) return;
        socket.leave(chatRoom(raw));
      })();
    });

    socket.on(SOCKET_CLIENT_CHAT_TYPING, async (data: { conversationId?: string; typing?: boolean }) => {
      const raw = data?.conversationId;
      if (!raw || typeof raw !== 'string') return;
      if (typeof data?.typing !== 'boolean') return;
      const typing = data.typing;

      const cid = parseObjectIdHex(raw);
      if (!cid) return;

      const m = await this.conversationMemberRepository.findMembership(cid, viewerOid);
      if (!m) return;

      if (typing) {
        const key = `${userId}:${raw}`;
        const now = Date.now();
        const last = this.typingLastEmit.get(key) ?? 0;
        if (now - last < TYPING_THROTTLE_MS) {
          return;
        }
        this.typingLastEmit.set(key, now);
      }

      this.io.to(chatRoom(raw)).emit(SOCKET_CLIENT_CHAT_TYPING, {
        conversationId: raw,
        userId,
        typing
      });
    });

    socket.on('disconnect', () => {
      void (async () => {
        try {
          const remaining = await this.io.in(userRoom(userId)).fetchSockets();
          if (remaining.length === 0) {
            const friends = await this.friendshipRepository.findFriendUserIdsForUser(viewerOid);
            for (const f of friends) {
              this.io.to(userRoom(f.toHexString())).emit(SOCKET_SERVER_PRESENCE_USER, {
                userId,
                online: false
              });
            }
          }

          for (const room of socket.rooms) {
            if (room.startsWith(SOCKET_ROOM_CHAT_PREFIX)) {
              const chatHex = room.slice(SOCKET_ROOM_CHAT_PREFIX.length);
              await this.emitChatPresenceAggregate(chatHex);
            }
          }
        } catch {
          /* best-effort */
        }
      })();
    });
  }
}
