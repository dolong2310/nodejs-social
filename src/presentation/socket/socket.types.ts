import type { AccessTokenPayload } from '@/modules/authentication/application/services/token.service.types';
import type { Server, Socket } from 'socket.io';

export interface ISocketFeature {
  mount(io: Server, socket: Socket, payload: AccessTokenPayload): void;
}
