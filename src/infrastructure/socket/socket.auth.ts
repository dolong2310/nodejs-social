import { ETokenType } from '@/domain/enums/token.enum';
import { EUserVerificationStatus } from '@/domain/enums/users.enum';
import { TokenPayload } from '@/domain/value-objects/token.value-object';

import {
  SocketEventUnauthorizedError,
  SocketTokenInvalidException,
  SocketUnauthorizedException,
  SocketUserBannedException,
  SocketUserNotFoundException,
  SocketUserNotVerifiedException
} from '@/application/errors/socket.error';
import { ISocketContext } from '@/application/ports/socket.port';
import { ITokenService } from '@/application/ports/token.port';
import { IUsersService } from '@/application/ports/user.port';

import { ExtendedError, Socket } from 'socket.io';

export type SocketAuthResolver = (socket: Socket) => Promise<ISocketContext>;

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

    const user = await usersService.findUserById({ userId: decoded.userId });
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
