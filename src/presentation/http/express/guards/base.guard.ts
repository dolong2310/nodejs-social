import { ForbiddenException } from '@/presentation/http/express/responses/error.response';
import { NextFunction, Request, Response } from 'express';

export abstract class BaseGuard {
  constructor() {
    this.handler = this.handler.bind(this);
  }

  async handler(request: Request, _response: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.canActivate(request);
      if (result) {
        next();
      } else {
        next(new ForbiddenException('You are not authorized to access this resource'));
      }
    } catch (error) {
      next(error);
    }
  }

  protected abstract canActivate(request: Request): Promise<boolean>;
}
