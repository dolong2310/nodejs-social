import { AccessTokenPayload } from '@/modules/auth/application/services/token.service.type';
import { Server, Socket } from 'socket.io';

export interface ISocketFeature {
  mount(io: Server, socket: Socket, payload: AccessTokenPayload): void;
}
