import { SearchQueryDTO } from '@/dtos/requests/search.request.dto';
import { createHash } from 'crypto';

export type SearchUsersCacheKeyParts = SearchQueryDTO & {
  userId?: string;
};

export const CACHE_KEYS = {
  user: (userId: string) => `user:${userId}`,
  followers: (userId: string) => `followers:${userId}`,
  searchUsers: (parts: SearchUsersCacheKeyParts): string => {
    const fingerprint = JSON.stringify(parts);
    const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 40);
    return `social:search:users:v1:${hash}`;
  }
} as const;

export const CACHE_TTL = {
  USER: 300, // 5 minutes — user profile changes infrequently
  FOLLOWERS: 600 // 10 minutes — follow graph changes infrequently
} as const;
