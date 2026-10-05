import { ONE_MINUTE_MS, FIVE_MINUTES_MS } from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const PERMISSION_THROTTLE_CONFIG = {
  LIST: {
    key: 'permissions:list',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  CREATE: {
    key: 'permissions:create',
    windowMs: FIVE_MINUTES_MS,
    limit: 20
  },
  GET_BY_ID: {
    key: 'permissions:get-by-id',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  UPDATE: {
    key: 'permissions:update',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  },
  REMOVE: {
    key: 'permissions:remove',
    windowMs: FIVE_MINUTES_MS,
    limit: 20
  }
} as const satisfies Record<string, ThrottlePolicy>;
