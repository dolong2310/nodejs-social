import { FIVE_MINUTES_MS } from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const OAUTH_THROTTLE_CONFIG = {
  GET_GOOGLE_AUTH_URL: {
    key: 'oauth:get-google-auth-url',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  },
  GOOGLE_LOGIN: {
    key: 'oauth:google-login',
    windowMs: FIVE_MINUTES_MS,
    limit: 10
  }
} as const satisfies Record<string, ThrottlePolicy>;
