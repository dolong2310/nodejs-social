import 'reflect-metadata';

import { createHttpServer } from '@/bootstrap/create-http-server';
import { createSocketServer } from '@/bootstrap/create-socket-server';
import logger from '@/infrastructure/logger/create-logger';

async function bootstrap() {
  const socketServer = createSocketServer();
  const { httpServer, port, appUrl } = await createHttpServer(socketServer);

  httpServer.listen(port, () => {
    logger.info({ port, appUrl }, 'server:::running');
  });
}

void bootstrap();
