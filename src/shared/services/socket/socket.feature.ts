import { Server, Socket } from 'socket.io';
import { SocketContext } from './socket.types';

export interface SocketFeature {
  mount(io: Server, socket: Socket, ctx: SocketContext): void;
}
