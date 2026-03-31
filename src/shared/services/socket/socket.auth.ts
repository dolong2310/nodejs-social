import { ETokenType, TokenPayload } from '@/interfaces';
import { EUserVerificationStatus, IUsersService } from '@/modules';
import { ITokenService } from '@/shared';
import {
  SocketEventUnauthorizedError,
  SocketTokenInvalidException,
  SocketUnauthorizedException,
  SocketUserBannedException,
  SocketUserNotFoundException,
  SocketUserNotVerifiedException
} from '@/shared/exceptions';
import { ExtendedError, Socket } from 'socket.io';
import { SocketContext } from './socket.types';

export type SocketAuthResolver = (socket: Socket) => Promise<SocketContext>;

export function createSocketAuthResolver(
  usersService: IUsersService,
  tokenService: ITokenService
): {
  handshake: (socket: Socket, next: (err?: ExtendedError) => void) => void;
  perEvent: (socket: Socket, next: (err?: Error) => void) => void;
  resolveContext: SocketAuthResolver;
} {
  /**
   * verify user từ access token
   */
  async function verifyFromHandshake(socket: Socket): Promise<{ accessToken: string; decoded: TokenPayload }> {
    const { Authorization } = socket.handshake.auth;
    const accessToken = Authorization?.split(' ')[1];
    if (!accessToken) {
      throw SocketUnauthorizedException;
    }

    const decoded = await tokenService.verifyAccessToken(accessToken);
    if (decoded.type !== ETokenType.ACCESS_TOKEN) {
      throw SocketTokenInvalidException;
    }

    const user = await usersService.findUserById(decoded.userId);
    if (!user) {
      throw SocketUserNotFoundException;
    }
    if (user.verificationStatus === EUserVerificationStatus.UNVERIFIED) {
      throw SocketUserNotVerifiedException;
    }
    if (user.verificationStatus === EUserVerificationStatus.BANNED) {
      throw SocketUserBannedException;
    }

    return { accessToken, decoded };
  }

  /**
   * verify token type từ existing access token
   */
  async function verifyExistingAccessToken(socket: Socket): Promise<TokenPayload> {
    const { accessToken } = socket.handshake.auth;
    if (!accessToken) {
      throw SocketUnauthorizedException;
    }

    const decoded = await tokenService.verifyAccessToken(accessToken);
    if (decoded.type !== ETokenType.ACCESS_TOKEN) {
      throw SocketTokenInvalidException;
    }

    return decoded as TokenPayload;
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
          next(SocketEventUnauthorizedError);
        }
      })();
    },
    /**
     * lấy ngữ cảnh user (userId) sau khi đã auth
     */
    resolveContext: async (socket) => {
      const decoded = socket.handshake.auth.decoded as TokenPayload | undefined;
      if (!decoded?.userId) {
        throw SocketUnauthorizedException;
      }
      return { userId: decoded.userId };
    }
  };
}
