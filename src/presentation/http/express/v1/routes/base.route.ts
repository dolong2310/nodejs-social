import express, { Router } from 'express';

export abstract class BaseRoute {
  protected router: Router;
  protected abstract readonly version: string;
  protected abstract readonly pathName: string;

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
