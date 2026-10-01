import { appConfig } from '@/bootstrap/config/app.config';
import { Server as SocketServer } from 'socket.io';

export function createSocketServer(): SocketServer {
  const socketServer = new SocketServer({
    cors: appConfig.cors
  });

  return socketServer;
}
