export const CACHE_KEYS = {
  friends: (userId: string) => `friends:${userId}`
} as const;

export const CACHE_TTL = {
  FRIENDS_GRAPH: 600 // 10 minutes — mutual friends graph changes infrequently
} as const;
