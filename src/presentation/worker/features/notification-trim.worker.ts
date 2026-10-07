import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import {
  NOTIFICATION_TRIM_QUEUE_NAME,
  type NotificationTrimJobData,
  type NotificationTrimJobResult
} from '@/modules/notification/application/ports/notification-trim-job.port';
import {
  TrimNotificationsInputPort,
  type TrimNotificationsPort
} from '@/modules/notification/application/use-cases/trim-notifications/trim-notifications.port';
import { BaseWorker } from '@/presentation/worker/core/base.worker';
import type { ConnectionOptions, Job } from 'bullmq';

export class NotificationTrimWorker extends BaseWorker<NotificationTrimJobData, NotificationTrimJobResult> {
  private readonly log: LoggerPort;

  constructor(
    protected readonly connection: ConnectionOptions,
    private readonly trimNotificationsUC: TrimNotificationsPort,
    private readonly logger: LoggerPort
  ) {
    super({ name: NOTIFICATION_TRIM_QUEUE_NAME, workerOptions: { connection, concurrency: 1 } });
    this.log = this.logger.child({ module: 'notification-trim-worker' });
  }

  protected override async process(
    job: Job<NotificationTrimJobData, NotificationTrimJobResult>
  ): Promise<NotificationTrimJobResult> {
    const { recipientUserIds } = job.data;

    if (recipientUserIds.length >= 50) {
      this.log.info(
        { jobId: job.id, recipients: recipientUserIds.length },
        'worker:::processing-notification-trim-job'
      );
    }

    const result = await this.trimNotificationsUC.execute(new TrimNotificationsInputPort({ recipientUserIds }));
    return { processedRecipients: result.processedRecipients };
  }
}
