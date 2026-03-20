import { createApp } from '@/app';
import { config, envConfig, isProduction } from '@/config';
import { logger } from '@/logger';
import { initUploadsFolder } from '@/utils/file.util';
import { createServer } from 'http';

async function bootstrap() {
  const port = config.port;
  const httpServer = createServer();

  initUploadsFolder();

  await createApp(httpServer, {
    database: {
      uri: config.database.uri,
      databaseName: config.database.name
    },
    redis: config.redis,
    cors: {
      origin: isProduction ? envConfig.FRONTEND_URL : '*',
      credentials: true
    }
    // rateLimitOptions: {
    //   windowMs: 15 * 60 * 1000, // 15 minutes
    //   limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    //   standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    //   legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    //   ipv6Subnet: 56 // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
    //   // store: ... , // Redis, Memcached, etc. See below.
    // }
  });

  httpServer.listen(port, () => {
    logger.info({ port }, 'server listening');
  });
}

bootstrap();
