import { SearchUsersQuery } from '@/modules/user/application/use-cases/search-users/search-users.port';
import { createHash } from 'crypto';

export const CACHE_KEYS = {
  user: (userId: string) => `user:${userId}`,
  userByUsername: (username: string) => `user:username:${username.toLowerCase()}`,
  searchUsers: (query: SearchUsersQuery): string => {
    const fingerprint = JSON.stringify(query);
    const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 40);
    return `social:search:users:v2:${hash}`;
  }
} as const;

export const CACHE_TTL = {
  USER: 300, // 5 minutes — user profile changes infrequently
  SEARCH_USERS: 30 // 30 seconds
} as const;
