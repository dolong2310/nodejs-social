export interface ISocketContext {
  userId: string;
}

export interface ISocketConnection {
  id: string;
  rooms: Set<string>;

  join(room: string): void;
  leave(room: string): void;

  on<T = unknown>(event: string, handler: (data: T) => void | Promise<void>): void;
  onDisconnect(handler: () => void | Promise<void>): void;
}

export interface ISocketServer {
  to(room: string | string[]): {
    emit<T = unknown>(event: string, data: T): void;
  };

  fetchSocketsInRoom(room: string): Promise<ISocketConnection[]>;
}

export interface ISocketFeature {
  mount(server: ISocketServer, socket: ISocketConnection, ctx: ISocketContext): void;
}
