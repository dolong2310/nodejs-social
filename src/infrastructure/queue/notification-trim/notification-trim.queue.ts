import { ILogger } from '@/application/ports/logger.port';
import {
  INotificationTrimJobData,
  INotificationTrimJobResult,
  INotificationTrimQueue
} from '@/application/ports/notification-trim-job.port';

import { NOTIFICATION_TRIM_QUEUE_NAME } from '@/infrastructure/queue/notification-trim/notification-trim.type';

import { Queue, type ConnectionOptions } from 'bullmq';

// Producer
export class BullMQNotificationTrimQueue implements INotificationTrimQueue {
  private readonly queue: Queue<INotificationTrimJobData, INotificationTrimJobResult>;
  private readonly log: ILogger;

  constructor(
    readonly connection: ConnectionOptions,
    private readonly logger: ILogger
  ) {
    this.log = this.logger.child({ module: 'notification-trim-queue' });
    this.queue = new Queue<INotificationTrimJobData, INotificationTrimJobResult>(NOTIFICATION_TRIM_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 1000, age: 24 * 3600 },
        removeOnFail: { count: 500, age: 7 * 24 * 3600 }
      }
    });

    this.queue.on('error', (err) => {
      this.log.error({ err }, 'notification trim queue error');
    });
  }

  async add(data: INotificationTrimJobData): Promise<void> {
    await this.queue.add('trim', data);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
