import { ONE_MINUTE_MS } from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const SEARCH_THROTTLE_CONFIG = {
  SEARCH: {
    key: 'search:search',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  }
} as const satisfies Record<string, ThrottlePolicy>;
