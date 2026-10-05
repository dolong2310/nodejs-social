import type { AccessTokenPayload } from '@/modules/authentication/application/ports/token.port';
import type { Server, Socket } from 'socket.io';

export interface ISocketFeature {
  mount(io: Server, socket: Socket, payload: AccessTokenPayload): void;
}
