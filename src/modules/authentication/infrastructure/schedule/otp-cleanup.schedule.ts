import { BaseSchedule } from '@/infrastructure/queue/bullmq/base.schedule';
import {
  IOtpCleanupJobData,
  IOtpCleanupJobResult
} from '@/modules/authentication/application/ports/otp-cleanup-job.port';
import { CronExpression } from '@/modules/common/enums/cron-expression.enum';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { type ConnectionOptions } from 'bullmq';

export const OTP_CLEANUP_SCHEDULE_QUEUE_NAME = 'otp-cleanup-schedule';

export class OtpCleanupSchedule extends BaseSchedule<IOtpCleanupJobData, IOtpCleanupJobResult> {
  constructor(
    readonly connection: ConnectionOptions,
    private readonly logger: LoggerPort
  ) {
    super({
      name: OTP_CLEANUP_SCHEDULE_QUEUE_NAME,
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
    const OTP_CLEANUP_SCHEDULE_ID = 'every-6-hours-expired-otp-cleanup';
    const OTP_CLEANUP_JOB_NAME = 'delete-expired-otps';

    try {
      await this.queue.upsertJobScheduler(
        OTP_CLEANUP_SCHEDULE_ID,
        {
          pattern: CronExpression.EVERY_6_HOURS,
          tz: 'Asia/Ho_Chi_Minh'
        },
        {
          name: OTP_CLEANUP_JOB_NAME,
          data: {}
        }
      );

      this.logger
        .child({ module: OTP_CLEANUP_SCHEDULE_QUEUE_NAME })
        .info({ cron: CronExpression.EVERY_6_HOURS, timezone: 'Asia/Ho_Chi_Minh' }, 'OTP cleanup scheduled');
    } catch (error) {
      this.logger.child({ module: OTP_CLEANUP_SCHEDULE_QUEUE_NAME }).error({ error }, 'failed to schedule OTP cleanup');
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
