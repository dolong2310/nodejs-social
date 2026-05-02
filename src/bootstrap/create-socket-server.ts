import { appConfig } from '@/bootstrap/config/app.config';
import { createServer } from 'http';
import { Server } from 'socket.io';

export async function createSocketServer() {
  const httpServer = createServer();
  const io = new Server(httpServer, {
    cors: appConfig.cors
  });

  return { httpServer, io };
}
