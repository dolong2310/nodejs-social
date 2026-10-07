import type { DatabasePort } from '@/infrastructure/persistence/database.port';
import type { RedisClientPort } from '@/infrastructure/persistence/redis/redis-client';
import type { TokenServicePort } from '@/modules/authentication/application/ports/token.port';
import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import type { UserServicePort } from '@/modules/user/application/services/user.service';
import type { BaseRoute } from '@/presentation/http/express/core/base.route';
import type { ISocketFeature } from '@/presentation/socket/socket.types';
import type { Server as SocketServer } from 'socket.io';

export interface IContainer {
  getRouters(): BaseRoute[];
  getContext(): {
    database: DatabasePort;
    redis: RedisClientPort;
    socket: SocketServer;
  };
  getSocketDeps(): {
    tokenService: TokenServicePort;
    userService: UserServicePort;
    features: ISocketFeature[];
  };
  getLogger(): LoggerPort;
}
