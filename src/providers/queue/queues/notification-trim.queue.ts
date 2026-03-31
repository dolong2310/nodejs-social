import { INotificationTrimJobData, INotificationTrimJobResult, LoggerInstance, QUEUE_NAMES } from '@/providers';
import { Queue, type ConnectionOptions } from 'bullmq';

const log = LoggerInstance.getLogger().child({ module: 'notification-trim-queue' });

export interface INotificationTrimJobQueue {
  add(data: INotificationTrimJobData): Promise<void>;
  close(): Promise<void>;
}

// Producer
export class NotificationTrimJobQueue implements INotificationTrimJobQueue {
  private readonly queue: Queue<INotificationTrimJobData, INotificationTrimJobResult>;

  constructor(connection: ConnectionOptions) {
    this.queue = new Queue<INotificationTrimJobData, INotificationTrimJobResult>(QUEUE_NAMES.NOTIFICATION_TRIM, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 1000, age: 24 * 3600 },
        removeOnFail: { count: 500, age: 7 * 24 * 3600 }
      }
    });

    this.queue.on('error', (err) => {
      log.error({ err }, 'notification trim queue error');
    });
  }

  async add(data: INotificationTrimJobData): Promise<void> {
    await this.queue.add('trim', data);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
