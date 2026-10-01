export const CACHE_KEYS = {
  role: (roleId: string) => `role:${roleId}`
} as const;

export const CACHE_TTL = {
  ROLE: 3600 // 1 hour
} as const;
