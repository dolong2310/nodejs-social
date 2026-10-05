import { ONE_MINUTE_MS, FIVE_MINUTES_MS } from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const PAYMENT_THROTTLE_CONFIG = {
  CREATE: {
    key: 'payments:create',
    windowMs: FIVE_MINUTES_MS,
    limit: 10
  },
  GET_BY_ID: {
    key: 'payments:get-by-id',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  }
} as const satisfies Record<string, ThrottlePolicy>;
