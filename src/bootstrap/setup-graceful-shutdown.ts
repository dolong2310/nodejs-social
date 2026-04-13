import { Closable } from '@/bootstrap/types/lifecycle';
import { Server as HttpServer } from 'http';

export function setupGracefulShutdown(httpServer: HttpServer, resources: Closable[]): void {
  const shutdown = async (signal: string) => {
    console.log({ signal }, 'shutting down gracefully');

    httpServer.close(async () => {
      await Promise.allSettled(resources.map((resource) => Promise.resolve(resource.close())));

      console.log('all connections closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
