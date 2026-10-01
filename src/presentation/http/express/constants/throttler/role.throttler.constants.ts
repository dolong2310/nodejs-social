import { ONE_MINUTE_MS, FIVE_MINUTES_MS } from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const ROLE_THROTTLE_CONFIG = {
  LIST: {
    key: 'roles:list',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  CREATE: {
    key: 'roles:create',
    windowMs: FIVE_MINUTES_MS,
    limit: 20
  },
  GET_BY_ID: {
    key: 'roles:get-by-id',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  UPDATE: {
    key: 'roles:update',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  },
  REMOVE: {
    key: 'roles:remove',
    windowMs: FIVE_MINUTES_MS,
    limit: 20
  }
} as const satisfies Record<string, ThrottlePolicy>;
