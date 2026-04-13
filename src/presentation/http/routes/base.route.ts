import express, { Router } from 'express';

export abstract class BaseRoute {
  protected router: Router;

  constructor(protected readonly basePath: string) {
    this.router = express.Router();
  }

  public getRouter(): Router {
    return this.router;
  }

  public getPath(): string {
    return this.basePath;
  }

  protected abstract initializeRoutes(): void;
}
