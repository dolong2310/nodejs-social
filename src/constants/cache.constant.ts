export const CACHE_KEYS = {
  user: (userId: string) => `user:${userId}`,
  followers: (userId: string) => `followers:${userId}`
} as const;

export const CACHE_TTL = {
  USER: 300, // 5 minutes — user profile changes infrequently
  FOLLOWERS: 600 // 10 minutes — follow graph changes infrequently
} as const;
