import { BaseWorker } from '@/infrastructure/queue/bullmq/base.worker';
import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import type {
  CacheWarmupJobData,
  CacheWarmupJobResult
} from '@/modules/operations/application/ports/cache-warmup-job.port';
import type { WarmRedisCacheUseCase } from '@/modules/operations/application/use-cases/warm-redis-cache/warm-redis-cache.usecase';
import { CACHE_WARMUP_SCHEDULE_QUEUE_NAME } from '@/modules/operations/infrastructure/schedule/cache-warmup.schedule';
import type { ConnectionOptions, Job } from 'bullmq';

export class CacheWarmupWorker extends BaseWorker<CacheWarmupJobData, CacheWarmupJobResult> {
  private readonly log: LoggerPort;

  constructor(
    protected readonly connection: ConnectionOptions,
    private readonly warmRedisCacheUC: WarmRedisCacheUseCase,
    private readonly logger: LoggerPort
  ) {
    super({ name: CACHE_WARMUP_SCHEDULE_QUEUE_NAME, workerOptions: { connection, concurrency: 1 } });
    this.log = this.logger.child({ module: 'cache-warmup-worker' });
  }

  protected override async process(job: Job<CacheWarmupJobData, CacheWarmupJobResult>): Promise<CacheWarmupJobResult> {
    const result = await this.warmRedisCacheUC.execute(job.data);
    this.log.info({ jobId: job.id, warmed: result.warmed }, 'worker:::redis-cache-warmed');
    return result;
  }
}
