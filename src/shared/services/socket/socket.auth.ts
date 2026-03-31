import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { ETokenType, TokenPayload } from '@/interfaces';
import { EUserVerificationStatus, IUsersService } from '@/modules';
import { AuthFailureError, ForbiddenError, NotFoundError } from '@/providers';
import { ITokenService } from '@/shared';
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
      throw new AuthFailureError();
    }

    const decoded = await tokenService.verifyAccessToken(accessToken);
    if (decoded.type !== ETokenType.ACCESS_TOKEN) {
      throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
    }

    const user = await usersService.findUserById(decoded.userId);
    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }
    if (user.verificationStatus === EUserVerificationStatus.UNVERIFIED) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.USER_NOT_VERIFIED_YET);
    }
    if (user.verificationStatus === EUserVerificationStatus.BANNED) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.USER_IS_BANNED);
    }

    return { accessToken, decoded };
  }

  /**
   * verify token type từ existing access token
   */
  async function verifyExistingAccessToken(socket: Socket): Promise<TokenPayload> {
    const { accessToken } = socket.handshake.auth;
    if (!accessToken) {
      throw new AuthFailureError();
    }

    const decoded = await tokenService.verifyAccessToken(accessToken);
    if (decoded.type !== ETokenType.ACCESS_TOKEN) {
      throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
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
          next(new Error('Unauthorized'));
        }
      })();
    },
    /**
     * lấy ngữ cảnh user (userId) sau khi đã auth
     */
    resolveContext: async (socket) => {
      const decoded = socket.handshake.auth.decoded as TokenPayload | undefined;
      if (!decoded?.userId) {
        throw new AuthFailureError();
      }
      return { userId: decoded.userId };
    }
  };
}
