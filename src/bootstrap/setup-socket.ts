import { appConfig } from '@/bootstrap/config/app.config';
import { IContainer } from '@/bootstrap/container';
import { SocketService } from '@/infrastructure/socket/socket.service';
import { Server as HttpServer } from 'http';

export function setupSocket(httpServer: HttpServer, container: IContainer) {
  const { tokenService, userService, presenceFeature, chatFeature } = container.getSocketDeps();
  const socket = new SocketService(httpServer, appConfig, {
    tokenService,
    userService,
    features: [presenceFeature, chatFeature]
  });

  container.bindRealtimeEmitter(socket);

  socket.run();

  return socket;
}
