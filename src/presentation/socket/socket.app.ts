import { IContainer } from '@/bootstrap/container';
import { AccessTokenPayload, ITokenService } from '@/modules/auth/application/services/token.service.type';
import { userRoom } from '@/modules/common/constants/socket.constant';
import { IUserService } from '@/modules/user/application/services/user.service';
import { EUserStatus } from '@/modules/user/domain/entities/user.type';
import { ExtendedError, Server, Socket } from 'socket.io';

export const createSocketApp = (io: Server, container: IContainer): Server => {
  const { tokenService, userService, features } = container.getSocketDeps();

  // middleware lúc bắt đầu kết nối
  io.use((socket, next) => socketAuthMiddleware(socket, next, tokenService, userService));

  io.on('connection', async (socket: Socket) => {
    const decoded = socket.handshake.auth.decoded as AccessTokenPayload | undefined;
    if (!decoded?.userId) {
      throw new Error('Unauthorized');
    }

    socket.join(userRoom(decoded.userId));

    // middleware xử lý mỗi event
    socket.use((_, next) => eventSocketMiddleware(socket, next, tokenService));

    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect();
      }
    });

    for (const feature of features) {
      feature.mount(io, socket, decoded);
    }
  });

  return io;
};

async function eventSocketMiddleware(socket: Socket, next: (err?: ExtendedError) => void, tokenService: ITokenService) {
  try {
    const { accessToken } = socket.handshake.auth;
    if (!accessToken) {
      throw new Error('Unauthorized');
    }

    const decoded = await tokenService.verifyAccessToken(accessToken);
    socket.handshake.auth.decoded = decoded;
    next();
  } catch (error) {
    next({
      message: 'Unauthorized',
      name: 'UnauthorizedError',
      cause: error
    });
  }
}

async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: ExtendedError) => void,
  tokenService: ITokenService,
  userService: IUserService
) {
  try {
    const { Authorization } = socket.handshake.auth;
    const accessToken = Authorization?.split(' ')[1];
    if (!accessToken) {
      throw new Error('Unauthorized');
    }

    const decoded = await tokenService.verifyAccessToken(accessToken);

    const user = await userService.findUserById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }
    if (user.status === EUserStatus.INACTIVE) {
      throw new Error('User is inactive');
    }
    if (user.status === EUserStatus.BANNED) {
      throw new Error('User is banned');
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
