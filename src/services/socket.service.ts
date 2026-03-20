import { envConfig } from '@/config';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { ETokenType } from '@/enums/token.enum';
import { EUserVerificationStatus } from '@/enums/users.enum';
import { AuthFailureError, ForbiddenError, NotFoundError } from '@/responses/error.response';
import TokenService, { ITokenService } from '@/services/token.service';
import { IUsersService } from '@/services/users.service';
import { TokenPayload } from '@/types/token.type';
import { Server as HttpServer } from 'http';
import { ExtendedError, Server, Socket } from 'socket.io';

export interface ISocketService {
  run(): void;
}

class SocketService implements ISocketService {
  private io: Server;
  private readonly tokenService: ITokenService;
  private users: Map<string, string> = new Map();

  constructor(
    httpServer: HttpServer,
    private readonly usersService: IUsersService
  ) {
    this.io = new Server(httpServer, {
      cors: {
        origin: envConfig.FRONTEND_URL,
        credentials: true
      }
    });

    this.tokenService = new TokenService();
  }

  public run() {
    this.io.use(this.initMiddleware.bind(this));
    this.io.on('connection', this.onConnection.bind(this));
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
    this.users.set(userId, socket.id);

    socket.use(async (_packet, next) => {
      try {
        const { accessToken } = socket.handshake.auth;
        // TODO: spit check + decoded token
        if (!accessToken) {
          throw new AuthFailureError();
        }

        const decoded = await this.tokenService.verifyAccessToken(accessToken);
        if (decoded.type !== ETokenType.ACCESS_TOKEN) {
          throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
        }

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

    socket.on('disconnect', () => {
      this.users.delete(userId);
    });

    // TODO: Tách ra Rest API để tạo conversation
    socket.on('sendMessage', async (data: { senderId: string; receiverId: string; content: string }) => {
      const { senderId, receiverId, content } = data;
      const toSocketId = this.users.get(receiverId);

      // emit message to frontend
      if (toSocketId) {
        socket.to(toSocketId).emit('receiveMessage', { senderId, receiverId, content });
      }

      // TODO: create conversation database
      // await conversationsService.createConversation({
      //   senderId,
      //   receiverId,
      //   content,
      //   lastMessage: content
      // });
    });
  }
}

export default SocketService;
