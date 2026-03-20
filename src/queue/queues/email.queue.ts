import { Queue, type ConnectionOptions } from 'bullmq';
import { IEmailJobResult, QUEUE_NAMES } from '@/queue/types';
import { IEmailPayload } from '@/types/mail.type';

export interface IEmailJobQueue {
  add(data: IEmailPayload): Promise<void>;
  close(): Promise<void>;
}

// Producer
export class EmailJobQueue implements IEmailJobQueue {
  private readonly queue: Queue<IEmailPayload, IEmailJobResult>;

  constructor(connection: ConnectionOptions) {
    this.queue = new Queue<IEmailPayload, IEmailJobResult>(QUEUE_NAMES.EMAIL, {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100, age: 24 * 3600 },
        removeOnFail: { count: 500, age: 7 * 24 * 3600 }
      }
    });

    this.queue.on('error', (err) => {
      console.error('\x1b[31m%s\x1b[0m', `[EmailQueue] ${err.message}`);
    });
  }

  async add(data: IEmailPayload): Promise<void> {
    await this.queue.add('send-email', data);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
