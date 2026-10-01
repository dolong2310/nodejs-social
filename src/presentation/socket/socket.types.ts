import { AccessTokenPayload } from '@/modules/authentication/application/services/token.service.types';
import { Server, Socket } from 'socket.io';

export interface ISocketFeature {
  mount(io: Server, socket: Socket, payload: AccessTokenPayload): void;
}
