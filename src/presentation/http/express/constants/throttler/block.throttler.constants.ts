import { ONE_MINUTE_MS, FIVE_MINUTES_MS } from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const BLOCK_THROTTLE_CONFIG = {
  LIST_BLOCKED: {
    key: 'blocks:list-blocked',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  BLOCK_USER: {
    key: 'blocks:block-user',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  },
  UNBLOCK_USER: {
    key: 'blocks:unblock-user',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  }
} as const satisfies Record<string, ThrottlePolicy>;
