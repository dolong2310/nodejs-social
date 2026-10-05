import { ONE_MINUTE_MS, FIVE_MINUTES_MS, FIFTEEN_MINUTES_MS } from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const USER_THROTTLE_CONFIG = {
  GET_ME: {
    key: 'users:get-me',
    windowMs: ONE_MINUTE_MS,
    limit: 120
  },
  UPDATE_ME: {
    key: 'users:update-me',
    windowMs: FIVE_MINUTES_MS,
    limit: 20
  },
  GET_PROFILE: {
    key: 'users:get-profile',
    windowMs: ONE_MINUTE_MS,
    limit: 120
  },
  CHANGE_PASSWORD: {
    key: 'users:change-password',
    windowMs: FIFTEEN_MINUTES_MS,
    limit: 5
  }
} as const satisfies Record<string, ThrottlePolicy>;
