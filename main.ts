import { createServer } from 'http';
import { envConfig, isProduction } from './src/config/index.js';
import { createApp } from './src/index.js';
import { initUploadsFolder } from './src/utils/file.util.js';

// import fakeData from '@/utils/fake-data';
// fakeData();

async function bootstrap() {
  const port = envConfig.PORT;
  const httpServer = createServer();

  initUploadsFolder();

  await createApp(httpServer, {
    database: {
      uri: envConfig.MONGODB_URI,
      databaseName: envConfig.DATABASE_NAME
    },
    cors: {
      origin: isProduction ? envConfig.FRONTEND_URL : '*',
      credentials: true
    },
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
    console.log(`\x1b[32mServer is running on port ${port}\x1b[0m`);
  });
}

bootstrap();
