import type {
  CacheWarmupJobData,
  CacheWarmupJobResult
} from '@/modules/operations/application/ports/cache-warmup-job.port';

export abstract class WarmRedisCachePort {
  abstract execute(data?: CacheWarmupJobData): Promise<CacheWarmupJobResult>;
}
