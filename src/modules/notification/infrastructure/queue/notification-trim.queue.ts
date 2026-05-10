import { BaseQueue } from '@/infrastructure/queue/bullmq/base.queue';
import {
  NotificationTrimJobData,
  NotificationTrimJobResult,
  NotificationTrimQueuePort
} from '@/modules/notification/application/ports/notification-trim-job.port';
import { type ConnectionOptions } from 'bullmq';

export const NOTIFICATION_TRIM_QUEUE_NAME = 'notification-trim';

// Producer
export class NotificationTrimQueue
  extends BaseQueue<NotificationTrimJobData, NotificationTrimJobResult>
  implements NotificationTrimQueuePort
{
  constructor(readonly connection: ConnectionOptions) {
    super({
      name: NOTIFICATION_TRIM_QUEUE_NAME,
      queueOptions: {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 1000, age: 24 * 3600 },
          removeOnFail: { count: 500, age: 7 * 24 * 3600 }
        }
      }
    });
  }

  async add(data: NotificationTrimJobData): Promise<void> {
    await this.queue.add('notification-trim', data);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
