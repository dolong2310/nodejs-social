import { Request } from 'express';

export interface BaseGuard {
  canActivate(req: Request): Promise<boolean> | boolean;
}
