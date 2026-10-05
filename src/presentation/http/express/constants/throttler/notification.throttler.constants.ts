import { ONE_MINUTE_MS } from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const NOTIFICATION_THROTTLE_CONFIG = {
  LIST: {
    key: 'notifications:list',
    windowMs: ONE_MINUTE_MS,
    limit: 120
  },
  MARK_READ: {
    key: 'notifications:mark-read',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  MARK_ONE_READ: {
    key: 'notifications:mark-one-read',
    windowMs: ONE_MINUTE_MS,
    limit: 120
  }
} as const satisfies Record<string, ThrottlePolicy>;
