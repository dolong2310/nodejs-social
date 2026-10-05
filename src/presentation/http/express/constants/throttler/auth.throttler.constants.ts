import {
  ONE_MINUTE_MS,
  FIVE_MINUTES_MS,
  TEN_MINUTES_MS,
  FIFTEEN_MINUTES_MS
} from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const AUTH_THROTTLE_CONFIG = {
  REGISTER: {
    key: 'auth:register',
    windowMs: FIFTEEN_MINUTES_MS,
    limit: 5
  },
  LOGIN: {
    key: 'auth:login',
    windowMs: FIVE_MINUTES_MS,
    limit: 10
  },
  LOGOUT: {
    key: 'auth:logout',
    windowMs: ONE_MINUTE_MS,
    limit: 30
  },
  REFRESH_TOKEN: {
    key: 'auth:refresh-token',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  },
  FORGOT_PASSWORD: {
    key: 'auth:forgot-password',
    windowMs: FIFTEEN_MINUTES_MS,
    limit: 5
  },
  SEND_OTP: {
    key: 'auth:send-otp',
    windowMs: TEN_MINUTES_MS,
    limit: 5
  },
  ENABLE_2FA: {
    key: 'auth:enable-2fa',
    windowMs: FIFTEEN_MINUTES_MS,
    limit: 5
  },
  DISABLE_2FA: {
    key: 'auth:disable-2fa',
    windowMs: FIFTEEN_MINUTES_MS,
    limit: 5
  }
} as const satisfies Record<string, ThrottlePolicy>;
