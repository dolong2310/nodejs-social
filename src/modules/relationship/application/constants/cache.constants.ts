import { createHash } from 'crypto';

export const CACHE_KEYS = {
  friends: (userId: string) => `friends:${userId}`,
  blockedUserIds: (userId: string): string => {
    const fingerprint = JSON.stringify(userId);
    const hash = createHash('sha256').update(fingerprint).digest('hex').slice(0, 40);
    return `social:blocks:ids:v1:${hash}`;
  }
} as const;

export const CACHE_TTL = {
  FRIENDS_GRAPH: 600, // 10 minutes — mutual friends graph changes infrequently
  BLOCKED_USER_IDS: 30 // short-lived: block graph can change frequently
} as const;
