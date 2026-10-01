import { IContainer } from '@/bootstrap/container';
import {
  AccessTokenPayload,
  TokenServicePort
} from '@/modules/authentication/application/services/token.service.types';
import { userRoom } from '@/modules/common/constants/socket.constants';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { EnumUserStatus } from '@/modules/user/domain/entities/user.types';
import { ExtendedError, Socket, Server as SocketServer } from 'socket.io';

export const createSocketApp = (socketServer: SocketServer, container: IContainer): SocketServer => {
  const { tokenService, userService, features } = container.getSocketDeps();

  // Middleware used when a socket starts connecting.
  socketServer.use((socket, next) => socketAuthMiddleware(socket, next, tokenService, userService));

  socketServer.on('connection', async (socket: Socket) => {
    const decoded = socket.handshake.auth.decoded as AccessTokenPayload | undefined;
    if (!decoded?.userId) {
      socket.disconnect(true);
      return;
    }

    socket.join(userRoom(decoded.userId));

    // Middleware used for each socket event.
    socket.use((_, next) => eventSocketMiddleware(socket, next, tokenService));

    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect();
      }
    });

    for (const feature of features) {
      feature.mount(socketServer, socket, decoded);
    }
  });

  return socketServer;
};

async function eventSocketMiddleware(
  socket: Socket,
  next: (err?: ExtendedError) => void,
  tokenService: TokenServicePort
) {
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
  tokenService: TokenServicePort,
  userService: UserServicePort
) {
  try {
    const { Authorization } = socket.handshake.auth;
    const accessToken = Authorization?.split(' ')[1];
    if (!accessToken) {
      throw new Error('Unauthorized');
    }

    const decoded = await tokenService.verifyAccessToken(accessToken);

    const user = await userService.findUserById(decoded.userId, { querySafe: true });
    if (!user) {
      throw new Error('User not found');
    }
    if (user.status === EnumUserStatus.INACTIVE) {
      throw new Error('User is inactive');
    }
    if (user.status === EnumUserStatus.BANNED) {
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
