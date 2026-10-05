import { BaseSchedule } from '@/infrastructure/queue/bullmq/base.schedule';
import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import type {
  CacheWarmupJobData,
  CacheWarmupJobResult
} from '@/modules/operations/application/ports/cache-warmup-job.port';
import type { ConnectionOptions } from 'bullmq';

export const CACHE_WARMUP_SCHEDULE_QUEUE_NAME = 'cache-warmup-schedule';

export class CacheWarmupSchedule extends BaseSchedule<CacheWarmupJobData, CacheWarmupJobResult> {
  constructor(
    readonly connection: ConnectionOptions,
    private readonly logger: LoggerPort
  ) {
    super({
      name: CACHE_WARMUP_SCHEDULE_QUEUE_NAME,
      queueOptions: {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 30, age: 30 * 24 * 3600 },
          removeOnFail: { count: 30, age: 30 * 24 * 3600 }
        }
      }
    });
    this.handleCron();
  }

  protected override async handleCron(): Promise<void> {
    const CACHE_WARMUP_SCHEDULE_ID = 'before-traffic-peak-cache-warmup';
    const CACHE_WARMUP_JOB_NAME = 'warm-redis-cache';
    const pattern = '0 30 6,11,18 * * *'; // high traffic peak at 6:30, 11:30, 18:30

    try {
      await this.queue.upsertJobScheduler(
        CACHE_WARMUP_SCHEDULE_ID,
        {
          pattern,
          tz: 'Asia/Ho_Chi_Minh'
        },
        {
          name: CACHE_WARMUP_JOB_NAME,
          data: {
            targets: ['roles', 'friend-graphs', 'hot-users'],
            hotUserLimit: 500
          }
        }
      );

      this.logger
        .child({ module: CACHE_WARMUP_SCHEDULE_QUEUE_NAME })
        .info({ cron: pattern, timezone: 'Asia/Ho_Chi_Minh' }, 'schedule:::cache-warmup');
    } catch (error) {
      this.logger
        .child({ module: CACHE_WARMUP_SCHEDULE_QUEUE_NAME })
        .error({ error }, 'schedule:::failed-to-schedule-cache-warmup');
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
