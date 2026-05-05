import { NOTIFICATION_TRIM_QUEUE_NAME } from '@/infrastructure/queue/notification-trim/notification-trim.queue';
import {
  INotificationTrimJobData,
  INotificationTrimJobResult
} from '@/modules/notification/application/ports/notification-trim-job.port';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { NOTIFICATION_MAX_PER_USER } from '@/modules/notification/application/constants/notification.constant';
import { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';
import { Worker, type ConnectionOptions, type Job } from 'bullmq';

export class NotificationTrimWorker {
  private readonly log: LoggerPort;

  constructor(
    private readonly notificationRepository: NotificationRepositoryPort,
    private readonly logger: LoggerPort
  ) {
    this.log = this.logger.child({ module: 'notification-trim-worker' });
  }

  // TODO: need reuse function from notifications.service.ts
  private async trimRecipient(recipientUserId: string): Promise<void> {
    const count = await this.notificationRepository.countForRecipient(recipientUserId);
    const limit = count - NOTIFICATION_MAX_PER_USER;
    if (limit <= 0) return;
    const ids = await this.notificationRepository.findOldestNotificationIdsForTrim({
      recipientId: recipientUserId,
      limit: limit
    });
    await this.notificationRepository.deleteNotificationsByIds(ids);
  }

  private async processNotificationTrimJob(
    job: Job<INotificationTrimJobData, INotificationTrimJobResult>
  ): Promise<INotificationTrimJobResult> {
    const recipientUserIds = [...new Set(job.data.recipientUserIds)];

    // Limit DB pressure during trimming (best-effort).
    const BATCH_SIZE = 5;
    let processedRecipients = 0;

    if (recipientUserIds.length >= 50) {
      this.log.info(
        { jobId: job.id, recipients: recipientUserIds.length, batchSize: BATCH_SIZE },
        'processing notification trim job'
      );
    }

    for (let i = 0; i < recipientUserIds.length; i += BATCH_SIZE) {
      const batch = recipientUserIds.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((rid) => this.trimRecipient(rid)));
      processedRecipients += batch.length;
    }

    return { processedRecipients };
  }

  public run(connection: ConnectionOptions): Worker<INotificationTrimJobData, INotificationTrimJobResult> {
    const worker = new Worker<INotificationTrimJobData, INotificationTrimJobResult>(
      NOTIFICATION_TRIM_QUEUE_NAME,
      this.processNotificationTrimJob.bind(this),
      { connection, concurrency: 1 }
    );

    worker.on('completed', (job) => {
      this.log.info({ jobId: job.id, processedRecipients: job.returnvalue?.processedRecipients }, 'job completed');
    });

    worker.on('failed', (job, err) => {
      this.log.error({ err, jobId: job?.id, attemptsMade: job?.attemptsMade }, 'notification trim job failed');
    });

    worker.on('error', (err) => {
      this.log.error({ err }, 'notification trim worker error');
    });

    return worker;
  }
}
