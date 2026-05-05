import { appConfig } from '@/bootstrap/config/app.config';
import logger from '@/infrastructure/logger/create-logger';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { InterceptorsConsumer } from '@/presentation/http/express/interceptors/interceptors.consumer';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import express, { Router } from 'express';

export abstract class BaseRoute {
  protected router: Router;
  protected abstract readonly version: string;
  protected abstract readonly pathName: string;

  protected readonly throttlerGuard = new ThrottlerProxyGuard(appConfig).handler;

  protected readonly interceptor = InterceptorsConsumer.create([
    new LoggingInterceptor(logger),
    new TransformResponseInterceptor(),
    new TimeoutInterceptor()
  ]);

  constructor() {
    this.router = express.Router();
  }

  public getRouter(): Router {
    return this.router;
  }

  public getVersion(): string {
    return this.version;
  }

  public getPath(): string {
    return this.pathName;
  }

  protected abstract createRoutes(): void;
}
