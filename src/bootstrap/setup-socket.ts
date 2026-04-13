import { ChatFeature } from '@/application/use-cases/socket/chat.feature';
import { PresenceFeature } from '@/application/use-cases/socket/presence.feature';

import { SocketService } from '@/infrastructure/socket/socket.service';

import { appConfig } from '@/bootstrap/config/app.config';
import { IContainer } from '@/bootstrap/container';

import { Server as HttpServer } from 'http';

export function setupSocket(httpServer: HttpServer, container: IContainer) {
  const { tokenService, usersService, friendshipRepository, conversationMemberRepository } = container.getSocketDeps();
  const socket = new SocketService(httpServer, appConfig, {
    tokenService,
    usersService,
    features: [new PresenceFeature(friendshipRepository), new ChatFeature(conversationMemberRepository)]
  });

  container.bindNotificationsSocket(socket);
  container.bindRealtimeChatEmitter(socket);

  socket.run();

  return socket;
}
