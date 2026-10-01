import { FIVE_MINUTES_MS } from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const OPERATIONS_THROTTLE_CONFIG = {
  CLEAR_REDIS_CACHE: {
    key: 'operations:clear-redis-cache',
    windowMs: FIVE_MINUTES_MS,
    limit: 5
  },
  SYNC_ROLE_PERMISSIONS: {
    key: 'operations:sync-role-permissions',
    windowMs: FIVE_MINUTES_MS,
    limit: 5
  }
} as const satisfies Record<string, ThrottlePolicy>;
