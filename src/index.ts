import 'reflect-metadata';
import { createApp } from '@/app';
import { envConfig } from '@/config/envConfig';
import { config, getCorsAllowedOrigins } from '@/config/generalConfig';
import { LoggerInstance } from '@/providers/logger/instance.logger';
import { initUploadsFolder } from '@/utils/file.util';
import { createServer } from 'http';

async function bootstrap() {
  const port = config.port;
  const httpServer = createServer();

  initUploadsFolder();

  await createApp(httpServer, {
    database: {
      uri: config.database.uri,
      databaseName: config.database.name,
      chatDatabaseName: envConfig.DATABASE_CHAT_NAME
    },
    redis: config.redis,
    cors: {
      origin: getCorsAllowedOrigins(),
      credentials: true
    },
    rateLimitOptions: {
      windowMs: config.rateLimit.windowMs,
      limit: config.rateLimit.limit,
      standardHeaders: config.rateLimit.standardHeaders,
      legacyHeaders: config.rateLimit.legacyHeaders,
      ipv6Subnet: config.rateLimit.ipv6Subnet
    }
  });

  httpServer.listen(port, () => {
    LoggerInstance.getLogger().info({ port }, 'server listening');
  });
}

bootstrap();
