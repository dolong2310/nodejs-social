export const CACHE_WARMUP_SCHEDULE_QUEUE_NAME = 'cache-warmup-schedule';

export type CacheWarmupTarget = 'roles' | 'hot-users' | 'friend-graphs';

export type CacheWarmupJobData = {
  targets?: CacheWarmupTarget[];
  hotUserLimit?: number;
};

export type CacheWarmupJobResult = {
  warmed: {
    roles: number;
    users: number;
    friendGraphs: number;
  };
};
