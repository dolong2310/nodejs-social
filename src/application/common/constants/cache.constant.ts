import { GetBlockedPostIdsPayload } from '@/application/services/post/post.service.type';
import { SearchUsersQuery } from '@/application/use-cases/search/search-users/search-users.in-port';
import { appConfig } from '@/bootstrap/config/app.config';
import { createHash } from 'crypto';

export const CACHE_KEYS = {
  user: (userId: string) => `user:${userId}`,
  userByUsername: (username: string) => `user:username:${username.toLowerCase()}`,
  friends: (userId: string) => `friends:${userId}`,
  searchUsers: (query: SearchUsersQuery): string => {
    const fingerprint = JSON.stringify(query);
    const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 40);
    return `social:search:users:v2:${hash}`;
  },
  blockedPostIds: (payload: GetBlockedPostIdsPayload): string => {
    const fingerprint = JSON.stringify(payload);
    const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 40);
    return `social:posts:blocked-interaction:v1:${hash}`;
  },
  blockedUserIds: (userId: string): string => {
    const fingerprint = JSON.stringify(userId);
    const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 40);
    return `social:blocks:ids:v1:${hash}`;
  }
} as const;

export const CACHE_TTL = {
  USER: 300, // 5 minutes — user profile changes infrequently
  FRIENDS_GRAPH: 600, // 10 minutes — mutual friends graph changes infrequently
  BLOCKED_INTERACTION_POST_IDS: 30, // short-lived: used for feed/search block-interaction exception checks
  BLOCKED_USER_IDS: 30, // short-lived: block graph can change frequently
  SEARCH_USERS: appConfig.searchCache.ttlSeconds // env-driven; 0 disables cache
} as const;
