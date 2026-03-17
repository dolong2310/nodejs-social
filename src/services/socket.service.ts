import { envConfig } from '@/constants/config.constant';
import { verifyAuthorizationMiddleware, verifyUserMiddleware } from '@/middlewares/common.middleware';
import { AccessTokenPayload } from '@/types/token.type';
import { Server as HttpServer } from 'http';
import { ExtendedError, Server, Socket } from 'socket.io';
import conversationsService from './conversations.service';

class SocketService {
  private io: Server;
  private users: Map<string, string> = new Map();

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: envConfig.FRONTEND_URL,
        credentials: true
      }
    });
  }

  public run() {
    this.io.use(this.initMiddleware.bind(this));
    this.io.on('connection', this.onConnection.bind(this));
    this.io.on('disconnect', this.onDisconnect.bind(this));
  }

  private async initMiddleware(socket: Socket, next: (err?: ExtendedError) => void) {
    try {
      const { Authorization } = socket.handshake.auth;
      const accessToken = Authorization?.split(' ')[1];
      const decoded = await verifyAuthorizationMiddleware(accessToken);
      await verifyUserMiddleware(decoded.userId);
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
    const { userId } = socket.handshake.auth.decoded as AccessTokenPayload;
    this.users.set(userId, socket.id);

    socket.use(async (packet, next) => {
      try {
        const { accessToken } = socket.handshake.auth;
        await verifyAuthorizationMiddleware(accessToken);
        next();
      } catch (error) {
        next(new Error('Unauthorized'));
      }
    });

    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect();
      }
    });

    // TODO: Tách ra Rest API để tạo conversation
    socket.on('sendMessage', async (data: { senderId: string; receiverId: string; content: string }) => {
      const { senderId, receiverId, content } = data;
      const toSocketId = this.users.get(receiverId);

      // emit message to frontend
      if (toSocketId) {
        socket.to(toSocketId).emit('receiveMessage', { senderId, receiverId, content });
      }

      // create conversation database
      await conversationsService.createConversation({
        senderId,
        receiverId,
        content,
        lastMessage: content
      });
    });
  }

  private onDisconnect(socket: Socket) {
    const { userId } = socket.handshake.auth.decoded as AccessTokenPayload;
    this.users.delete(userId);
  }
}

export default SocketService;
