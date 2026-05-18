import { BaseWorker } from '@/infrastructure/queue/bullmq/base.worker';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import {
  NotificationTrimJobData,
  NotificationTrimJobResult
} from '@/modules/notification/application/ports/notification-trim-job.port';
import { NotificationServicePort } from '@/modules/notification/application/services/notification.service';
import { NOTIFICATION_TRIM_QUEUE_NAME } from '@/modules/notification/infrastructure/queue/notification-trim.queue';
import { type ConnectionOptions, type Job } from 'bullmq';

export class NotificationTrimWorker extends BaseWorker<NotificationTrimJobData, NotificationTrimJobResult> {
  private readonly log: LoggerPort;

  constructor(
    protected readonly connection: ConnectionOptions,
    private readonly notificationService: NotificationServicePort,
    private readonly logger: LoggerPort
  ) {
    super({ name: NOTIFICATION_TRIM_QUEUE_NAME, workerOptions: { connection, concurrency: 1 } });
    this.log = this.logger.child({ module: 'notification-trim-worker' });
  }

  protected override async process(
    job: Job<NotificationTrimJobData, NotificationTrimJobResult>
  ): Promise<NotificationTrimJobResult> {
    const recipientUserIds = [...new Set(job.data.recipientUserIds)];

    // Limit DB pressure during trimming (best-effort).
    const BATCH_SIZE = 5;
    let processedRecipients = 0;

    if (recipientUserIds.length >= 50) {
      this.log.info(
        { jobId: job.id, recipients: recipientUserIds.length, batchSize: BATCH_SIZE },
        'worker:::processing-notification-trim-job'
      );
    }

    for (let i = 0; i < recipientUserIds.length; i += BATCH_SIZE) {
      const batch = recipientUserIds.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((rid) => this.notificationService.trimRecipientIfNeeded(rid)));
      processedRecipients += batch.length;
    }

    return { processedRecipients };
  }
}
