import { ONE_MINUTE_MS, FIVE_MINUTES_MS } from '@/modules/common/constants/time.constants';
import type { ThrottlePolicy } from '@/presentation/http/express/guards/throttler-proxy.guard';

export const POST_THROTTLE_CONFIG = {
  GET_NEW_FEEDS: {
    key: 'posts:get-new-feeds',
    windowMs: ONE_MINUTE_MS,
    limit: 120
  },
  GET_BY_USER: {
    key: 'posts:get-by-user',
    windowMs: ONE_MINUTE_MS,
    limit: 120
  },
  PATCH: {
    key: 'posts:patch',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  },
  DELETE: {
    key: 'posts:delete',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  },
  GET_DETAIL: {
    key: 'posts:get-detail',
    windowMs: ONE_MINUTE_MS,
    limit: 120
  },
  GET_LIKED: {
    key: 'posts:get-liked',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  GET_BOOKMARKED: {
    key: 'posts:get-bookmarked',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  GET_BY_TYPE: {
    key: 'posts:get-by-type',
    windowMs: ONE_MINUTE_MS,
    limit: 120
  },
  CREATE: {
    key: 'posts:create',
    windowMs: FIVE_MINUTES_MS,
    limit: 30
  },
  CREATE_BOOKMARK: {
    key: 'posts:create-bookmark',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  DELETE_BOOKMARK: {
    key: 'posts:delete-bookmark',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  CREATE_LIKE: {
    key: 'posts:create-like',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  },
  DELETE_LIKE: {
    key: 'posts:delete-like',
    windowMs: ONE_MINUTE_MS,
    limit: 60
  }
} as const satisfies Record<string, ThrottlePolicy>;
