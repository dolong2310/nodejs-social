import {
  UserIsBannedException,
  UserIsInactiveException,
  UserNotFoundException
} from '@/application/exceptions/user.exception';
import { ISocketContext } from '@/application/ports/socket.port';
import { AccessTokenPayload, ITokenService } from '@/application/services/token/token.service.type';
import { IUserService } from '@/application/services/user/user.service';
import { EUserStatus } from '@/domain/entities/user/user.type';
import { SocketUnauthorizedError } from '@/presentation/http/exceptions/socket.exception';
import { ExtendedError, Socket } from 'socket.io';

export function createSocketAuthResolver(
  userService: IUserService,
  tokenService: ITokenService
): {
  handshake: (socket: Socket, next: (err?: ExtendedError) => void) => void;
  perEvent: (socket: Socket, next: (err?: Error) => void) => void;
  resolveContext: (socket: Socket) => Promise<ISocketContext>;
} {
  /**
   * verify user từ access token
   */
  async function verifyFromHandshake(socket: Socket): Promise<{ accessToken: string; decoded: AccessTokenPayload }> {
    const { Authorization } = socket.handshake.auth;
    const accessToken = Authorization?.split(' ')[1];
    if (!accessToken) {
      throw SocketUnauthorizedError;
    }

    const decoded = await tokenService.verifyAccessToken(accessToken);

    const user = await userService.findUserById(decoded.userId);
    if (!user) {
      throw UserNotFoundException;
    }
    if (user.status === EUserStatus.INACTIVE) {
      throw UserIsInactiveException;
    }
    if (user.status === EUserStatus.BANNED) {
      throw UserIsBannedException;
    }

    return { accessToken, decoded };
  }

  /**
   * verify token type từ existing access token
   */
  async function verifyExistingAccessToken(socket: Socket): Promise<AccessTokenPayload> {
    const { accessToken } = socket.handshake.auth;
    if (!accessToken) {
      throw SocketUnauthorizedError;
    }

    const decoded = await tokenService.verifyAccessToken(accessToken);

    return decoded as AccessTokenPayload;
  }

  return {
    /**
     * middleware lúc bắt đầu kết nối
     */
    handshake: (socket, next) => {
      void (async () => {
        try {
          const { accessToken, decoded } = await verifyFromHandshake(socket);
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
      })();
    },
    /**
     * middleware lúc xử lý mỗi event
     */
    perEvent: (socket, next) => {
      void (async () => {
        try {
          const decoded = await verifyExistingAccessToken(socket);
          socket.handshake.auth.decoded = decoded;
          next();
        } catch {
          next(SocketUnauthorizedError);
        }
      })();
    },
    /**
     * lấy ngữ cảnh user (userId) sau khi đã auth
     */
    resolveContext: async (socket) => {
      const decoded = socket.handshake.auth.decoded as AccessTokenPayload | undefined;
      if (!decoded?.userId) {
        throw SocketUnauthorizedError;
      }
      return { userId: decoded.userId };
    }
  };
}
