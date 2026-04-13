import {
  GetExtraVisiblePostIdsForBlockedEngagementPayloadDTO,
  ListBlockedUserIdsEitherDirectionCachedPayloadDTO
} from '@/application/dtos/post/post.payload.dto';
import { SearchPayloadDTO } from '@/application/dtos/search/search.payload.dto';

import { appConfig } from '@/bootstrap/config/app.config';

import { createHash } from 'crypto';

export const CACHE_KEYS = {
  user: (userId: string) => `user:${userId}`,
  userByUsername: (username: string) => `user:username:${username.toLowerCase()}`,
  friends: (userId: string) => `friends:${userId}`,
  searchUsers: (payload: SearchPayloadDTO): string => {
    const fingerprint = JSON.stringify(payload);
    const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 40);
    return `social:search:users:v2:${hash}`;
  },
  blockedEngagementPostIds: (payload: GetExtraVisiblePostIdsForBlockedEngagementPayloadDTO): string => {
    const fingerprint = JSON.stringify(payload);
    const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 40);
    return `social:posts:blocked-engagement:v1:${hash}`;
  },
  blockedUserIds: (payload: ListBlockedUserIdsEitherDirectionCachedPayloadDTO): string => {
    const fingerprint = JSON.stringify(payload);
    const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 40);
    return `social:blocks:ids:v1:${hash}`;
  }
} as const;

export const CACHE_TTL = {
  USER: 300, // 5 minutes — user profile changes infrequently
  FRIENDS_GRAPH: 600, // 10 minutes — mutual friends graph changes infrequently
  BLOCKED_ENGAGEMENT_POST_IDS: 30, // short-lived: used for feed/search block-engagement exception checks
  BLOCKED_USER_IDS: 30, // short-lived: block graph can change frequently
  SEARCH_USERS: appConfig.searchCache.ttlSeconds // env-driven; 0 disables cache
} as const;
