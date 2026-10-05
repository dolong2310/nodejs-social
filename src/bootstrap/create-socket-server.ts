import { APP_CONFIG } from '@/bootstrap/config/app.config';
import { Server as SocketServer } from 'socket.io';

export function createSocketServer(): SocketServer {
  const socketServer = new SocketServer({
    cors: { origin: APP_CONFIG.CORS.ORIGIN, credentials: APP_CONFIG.CORS.CREDENTIALS }
  });

  return socketServer;
}
