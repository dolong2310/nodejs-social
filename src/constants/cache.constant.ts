import { config } from '@/config/generalConfig';
import { SearchQueryDTO } from '@/modules/search/dtos/search.request.dto';
import { createHash } from 'crypto';

export type SearchUsersCacheKeyParts = SearchQueryDTO & {
  userId?: string;
};
export type BlockedEngagementCacheKeyParts = {
  userId: string;
  blockedAuthorIds: string[];
};
export type BlockedUserIdsCacheKeyParts = {
  userId: string;
};

export const CACHE_KEYS = {
  user: (userId: string) => `user:${userId}`,
  userByUsername: (username: string) => `user:username:${username.toLowerCase()}`,
  friends: (userId: string) => `friends:${userId}`,
  searchUsers: (parts: SearchUsersCacheKeyParts): string => {
    const fingerprint = JSON.stringify(parts);
    const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 40);
    return `social:search:users:v1:${hash}`;
  },
  blockedEngagementPostIds: (parts: BlockedEngagementCacheKeyParts): string => {
    const fingerprint = JSON.stringify(parts);
    const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 40);
    return `social:posts:blocked-engagement:v1:${hash}`;
  },
  blockedUserIds: (parts: BlockedUserIdsCacheKeyParts): string => {
    const fingerprint = JSON.stringify(parts);
    const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 40);
    return `social:blocks:ids:v1:${hash}`;
  }
} as const;

export const CACHE_TTL = {
  USER: 300, // 5 minutes — user profile changes infrequently
  FRIENDS_GRAPH: 600, // 10 minutes — mutual friends graph changes infrequently
  BLOCKED_ENGAGEMENT_POST_IDS: 30, // short-lived: used for feed/search block-engagement exception checks
  BLOCKED_USER_IDS: 30, // short-lived: block graph can change frequently
  SEARCH_USERS: config.searchCache.ttlSeconds // env-driven; 0 disables cache
} as const;
