import { Container } from '@/providers/container/instance.container';
import express, { Router } from 'express';

export abstract class BaseRoute {
  protected router: Router;
  protected container: Container;

  constructor() {
    this.router = express.Router();
    this.container = Container.get();
    this.initializeRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  protected abstract initializeRoutes(): void;
}
