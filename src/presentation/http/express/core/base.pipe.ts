import type { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';

/**
 * Runs after guards and before the controller. A pipe validates/transforms the request in place
 * and throws an `HttpException` to stop the request early.
 */
export interface BasePipe {
  transform(req: ExpressRequest, res: ExpressResponse): Promise<void> | void;
}
