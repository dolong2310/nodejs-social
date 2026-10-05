import { ONE_MINUTE_MS, FIVE_MINUTES_MS } from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const HASHTAG_THROTTLE_CONFIG = {
  LIST: {
    key: 'hashtags:list',
    windowMs: ONE_MINUTE_MS,
    limit: 120
  },
  CREATE: {
    key: 'hashtags:create',
    windowMs: FIVE_MINUTES_MS,
    limit: 20
  },
  GET_BY_ID: {
    key: 'hashtags:get-by-id',
    windowMs: ONE_MINUTE_MS,
    limit: 120
  },
  UPDATE: {
    key: 'hashtags:update',
    windowMs: FIVE_MINUTES_MS,
    limit: 20
  },
  REMOVE: {
    key: 'hashtags:remove',
    windowMs: FIVE_MINUTES_MS,
    limit: 20
  }
} as const satisfies Record<string, ThrottlePolicy>;
