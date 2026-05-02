import { LoggerPort } from '@/modules/core/infrastructure/logger/logger.port';
import {
  INotificationTrimJobData,
  INotificationTrimJobResult,
  INotificationTrimQueue
} from '@/modules/core/application/ports/notification-trim-job.port';
import { Queue, type ConnectionOptions } from 'bullmq';

export const NOTIFICATION_TRIM_QUEUE_NAME = 'notification-trim';

// Producer
export class BullMQNotificationTrimQueue implements INotificationTrimQueue {
  private readonly queue: Queue<INotificationTrimJobData, INotificationTrimJobResult>;
  private readonly log: LoggerPort;

  constructor(
    readonly connection: ConnectionOptions,
    private readonly logger: LoggerPort
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
