import 'reflect-metadata';

import { createWorker } from '@/bootstrap/create-worker';
import logger from '@/infrastructure/logger/create-logger';

async function bootstrap() {
  await createWorker();

  logger.info('worker:::running');
}

void bootstrap();
