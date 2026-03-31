import { NOTIFICATION_MAX_PER_USER } from '@/constants';
import { AutoBind } from '@/decorators';
import {
  Container,
  INotificationTrimJobData,
  INotificationTrimJobResult,
  LoggerInstance,
  QUEUE_NAMES
} from '@/providers';
import { Worker, type ConnectionOptions, type Job } from 'bullmq';

const log = LoggerInstance.getLogger().child({ module: 'notification-trim-worker' });

export interface INotificationTrimWorker {
  createWorker(connection: ConnectionOptions): Worker<INotificationTrimJobData, INotificationTrimJobResult>;
}

export class NotificationTrimWorker implements INotificationTrimWorker {
  private get notificationRepository() {
    return Container.get().getNotificationRepository();
  }

  // TODO: need reuse function from notifications.service.ts
  private async trimRecipient(recipientUserId: string): Promise<void> {
    const count = await this.notificationRepository.countForRecipient(recipientUserId);
    const excess = count - NOTIFICATION_MAX_PER_USER;
    if (excess <= 0) return;
    const ids = await this.notificationRepository.findOldestIdsForTrim(recipientUserId, excess);
    await this.notificationRepository.deleteByIds(ids);
  }

  @AutoBind
  private async processNotificationTrimJob(
    job: Job<INotificationTrimJobData, INotificationTrimJobResult>
  ): Promise<INotificationTrimJobResult> {
    const recipientUserIds = [...new Set(job.data.recipientUserIds)];

    // Limit DB pressure during trimming (best-effort).
    const BATCH_SIZE = 5;
    let processedRecipients = 0;

    if (recipientUserIds.length >= 50) {
      log.info(
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

  public createWorker(connection: ConnectionOptions): Worker<INotificationTrimJobData, INotificationTrimJobResult> {
    const worker = new Worker<INotificationTrimJobData, INotificationTrimJobResult>(
      QUEUE_NAMES.NOTIFICATION_TRIM,
      this.processNotificationTrimJob,
      { connection, concurrency: 1 }
    );

    worker.on('completed', (job) => {
      log.info({ jobId: job.id, processedRecipients: job.returnvalue?.processedRecipients }, 'job completed');
    });

    worker.on('failed', (job, err) => {
      log.error({ err, jobId: job?.id, attemptsMade: job?.attemptsMade }, 'notification trim job failed');
    });

    worker.on('error', (err) => {
      log.error({ err }, 'notification trim worker error');
    });

    return worker;
  }
}
