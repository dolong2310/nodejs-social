import type { ControllerResult, ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';

export interface BaseInterceptor {
  intercept(
    req: ExpressRequest,
    res: ExpressResponse,
    next: () => Promise<unknown>
  ): ControllerResult | Promise<ControllerResult>;
}
