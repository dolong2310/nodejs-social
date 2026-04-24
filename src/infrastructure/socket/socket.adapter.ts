import { ISocketConnection, ISocketServer } from '@/application/ports/socket.port';
import { Server, Socket } from 'socket.io';

export class SocketIOConnection implements ISocketConnection {
  constructor(private readonly socket: Socket) {}

  get id(): string {
    return this.socket.id;
  }

  get rooms(): Set<string> {
    return this.socket.rooms;
  }

  join(room: string): void {
    this.socket.join(room);
  }

  leave(room: string): void {
    this.socket.leave(room);
  }

  on<T>(event: string, handler: (data: T) => void | Promise<void>): void {
    this.socket.on(event, handler);
  }

  onDisconnect(handler: () => void | Promise<void>): void {
    this.socket.on('disconnect', handler);
  }
}

export class SocketIOServer implements ISocketServer {
  constructor(private readonly io: Server) {}

  to(room: string | string[]) {
    return {
      emit: <T>(event: string, data: T) => {
        this.io.to(room).emit(event, data);
      }
    };
  }

  async fetchSocketsInRoom(room: string): Promise<ISocketConnection[]> {
    const sockets = await this.io.in(room).fetchSockets();
    return sockets.map((socket) => new SocketIOConnection(socket as unknown as Socket));
  }
}
