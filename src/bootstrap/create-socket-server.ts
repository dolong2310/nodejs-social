import { appConfig } from '@/bootstrap/config/app.config';
import { Server } from 'socket.io';

export async function createSocketServer() {
  const io = new Server({
    cors: appConfig.cors
  });

  return { io };
}
