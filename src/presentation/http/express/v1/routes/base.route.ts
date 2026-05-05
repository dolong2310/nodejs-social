import { appConfig } from '@/bootstrap/config/app.config';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import express, { Router } from 'express';

export abstract class BaseRoute {
  protected router: Router;
  protected abstract readonly version: string;
  protected abstract readonly pathName: string;

  protected readonly throttlerGuard = new ThrottlerProxyGuard(appConfig).handler;
  protected readonly transformInterceptor = new TransformResponseInterceptor().intercept;

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
