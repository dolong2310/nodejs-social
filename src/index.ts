import 'reflect-metadata';

import { createHttpServer } from '@/bootstrap/create-http-server';
import { createSocketServer } from '@/bootstrap/create-socket-server';
import logger from '@/infrastructure/logger/create-logger';

async function bootstrap() {
  const { io } = await createSocketServer();
  const { server, port, appUrl } = await createHttpServer(io);
  server.listen(port, () => {
    logger.info({ port, appUrl }, 'server:::running');
  });
}

bootstrap();
