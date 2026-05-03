import 'reflect-metadata';

import { createHttpServer } from '@/bootstrap/create-http-server';
import { createSocketServer } from '@/bootstrap/create-socket-server';
import logger from '@/infrastructure/logger/create-logger';

async function bootstrap() {
  const { httpServer, io } = await createSocketServer();
  const { server, port, appUrl } = await createHttpServer(httpServer, io);
  server.listen(port, () => {
    logger.info({ port, appUrl }, 'server running');
  });
}

bootstrap();
