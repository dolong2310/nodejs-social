import { ONE_MINUTE_MS, FIVE_MINUTES_MS } from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const ADMIN_USER_THROTTLE_CONFIG = {
  LIST: {
    key: 'admin-users:list',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  CREATE: {
    key: 'admin-users:create',
    windowMs: FIVE_MINUTES_MS,
    limit: 20
  },
  GET_BY_ID: {
    key: 'admin-users:get-by-id',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  UPDATE: {
    key: 'admin-users:update',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  },
  REMOVE: {
    key: 'admin-users:remove',
    windowMs: FIVE_MINUTES_MS,
    limit: 20
  }
} as const satisfies Record<string, ThrottlePolicy>;
