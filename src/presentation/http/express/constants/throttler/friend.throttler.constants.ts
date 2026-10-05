import { ONE_MINUTE_MS, FIVE_MINUTES_MS } from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const FRIEND_THROTTLE_CONFIG = {
  LIST_FRIENDS: {
    key: 'friends:list-friends',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  LIST_INCOMING: {
    key: 'friends:list-incoming',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  LIST_OUTGOING: {
    key: 'friends:list-outgoing',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  SEND_REQUEST: {
    key: 'friends:send-request',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  },
  ACCEPT_REQUEST: {
    key: 'friends:accept-request',
    windowMs: FIVE_MINUTES_MS,
    limit: 60
  },
  DECLINE_REQUEST: {
    key: 'friends:decline-request',
    windowMs: FIVE_MINUTES_MS,
    limit: 60
  },
  REVOKE_REQUEST: {
    key: 'friends:revoke-request',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  },
  UNFRIEND: {
    key: 'friends:unfriend',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  }
} as const satisfies Record<string, ThrottlePolicy>;
