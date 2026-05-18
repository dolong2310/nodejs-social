import { BaseSchedule } from '@/infrastructure/queue/bullmq/base.schedule';
import {
  RefreshTokenCleanupJobData,
  RefreshTokenCleanupJobResult
} from '@/modules/authentication/application/ports/refresh-token-cleanup-job.port';
import { EnumCronExpression } from '@/modules/common/enums/cron-expression.enum';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { type ConnectionOptions } from 'bullmq';

export const REFRESH_TOKEN_CLEANUP_SCHEDULE_QUEUE_NAME = 'refresh-token-cleanup-schedule';

export class RefreshTokenCleanupSchedule extends BaseSchedule<
  RefreshTokenCleanupJobData,
  RefreshTokenCleanupJobResult
> {
  constructor(
    readonly connection: ConnectionOptions,
    private readonly logger: LoggerPort
  ) {
    super({
      name: REFRESH_TOKEN_CLEANUP_SCHEDULE_QUEUE_NAME,
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
    const REFRESH_TOKEN_CLEANUP_SCHEDULE_ID = 'daily-expired-refresh-token-cleanup';
    const REFRESH_TOKEN_CLEANUP_JOB_NAME = 'delete-expired-refresh-tokens';

    try {
      await this.queue.upsertJobScheduler(
        REFRESH_TOKEN_CLEANUP_SCHEDULE_ID,
        {
          pattern: EnumCronExpression.EVERY_DAY_AT_MIDNIGHT,
          tz: 'Asia/Ho_Chi_Minh'
        },
        {
          name: REFRESH_TOKEN_CLEANUP_JOB_NAME,
          data: {}
        }
      );

      this.logger
        .child({ module: REFRESH_TOKEN_CLEANUP_SCHEDULE_QUEUE_NAME })
        .info(
          { cron: EnumCronExpression.EVERY_DAY_AT_MIDNIGHT, timezone: 'Asia/Ho_Chi_Minh' },
          'schedule:::refresh-token-cleanup'
        );
    } catch (error) {
      this.logger
        .child({ module: REFRESH_TOKEN_CLEANUP_SCHEDULE_QUEUE_NAME })
        .error({ error }, 'schedule:::failed-to-schedule-refresh-token-cleanup');
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
