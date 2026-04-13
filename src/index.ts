import 'reflect-metadata';
import { createHttpServer } from '@/bootstrap/create-http-server';
import logger from '@/infrastructure/logger/create-logger';

async function bootstrap() {
  const { server, port } = await createHttpServer();
  server.listen(port, () => {
    logger.info({ port }, 'server listening');
  });
}

bootstrap();
