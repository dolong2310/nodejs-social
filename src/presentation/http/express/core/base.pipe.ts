import type { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';

export interface BasePipe {
  transform<TRequest = ExpressRequest, TResponse = ExpressResponse>(
    req: TRequest,
    res: TResponse
  ): Promise<void> | void;
}
