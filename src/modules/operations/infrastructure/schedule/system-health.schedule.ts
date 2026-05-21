import { BaseSchedule } from '@/infrastructure/queue/bullmq/base.schedule';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import {
  SystemHealthJobData,
  SystemHealthJobResult
} from '@/modules/operations/application/ports/system-health-job.port';
import { type ConnectionOptions } from 'bullmq';

export const SYSTEM_HEALTH_SCHEDULE_QUEUE_NAME = 'system-health-schedule';

type SystemHealthScheduleConfig = {
  enabled: boolean;
  cron: string;
  timezone: string;
};

const SYSTEM_HEALTH_SCHEDULE_ID = 'system-health-monitor';
const SYSTEM_HEALTH_JOB_NAME = 'check-system-health';

export class SystemHealthSchedule extends BaseSchedule<SystemHealthJobData, SystemHealthJobResult> {
  constructor(
    readonly connection: ConnectionOptions,
    private readonly logger: LoggerPort,
    private readonly config: SystemHealthScheduleConfig
  ) {
    super({
      name: SYSTEM_HEALTH_SCHEDULE_QUEUE_NAME,
      queueOptions: {
        connection,
        defaultJobOptions: {
          attempts: 2,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 50, age: 7 * 24 * 3600 },
          removeOnFail: { count: 50, age: 7 * 24 * 3600 }
        }
      }
    });
    this.handleCron();
  }

  protected override async handleCron(): Promise<void> {
    try {
      if (!this.config.enabled) {
        await this.queue.removeJobScheduler(SYSTEM_HEALTH_SCHEDULE_ID);

        this.logger.child({ module: SYSTEM_HEALTH_SCHEDULE_QUEUE_NAME }).info('schedule:::system-health-disabled');
        return;
      }

      await this.queue.upsertJobScheduler(
        SYSTEM_HEALTH_SCHEDULE_ID,
        {
          pattern: this.config.cron,
          tz: this.config.timezone
        },
        {
          name: SYSTEM_HEALTH_JOB_NAME,
          data: { triggeredBy: 'schedule' }
        }
      );

      this.logger
        .child({ module: SYSTEM_HEALTH_SCHEDULE_QUEUE_NAME })
        .info({ cron: this.config.cron, timezone: this.config.timezone }, 'schedule:::system-health');
    } catch (error) {
      this.logger
        .child({ module: SYSTEM_HEALTH_SCHEDULE_QUEUE_NAME })
        .error({ error }, 'schedule:::failed-to-schedule-system-health');
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
