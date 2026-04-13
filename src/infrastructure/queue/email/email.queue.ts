import { IEmailJobData, IEmailJobResult, IEmailQueue } from '@/application/ports/email-job.port';
import { ILogger } from '@/application/ports/logger.port';

import { EMAIL_QUEUE_NAME } from '@/infrastructure/queue/email/email.type';

import { Queue, type ConnectionOptions } from 'bullmq';

export class BullMQEmailQueue implements IEmailQueue {
  private readonly queue: Queue<IEmailJobData, IEmailJobResult>;
  private readonly log: ILogger;

  constructor(
    readonly connection: ConnectionOptions,
    private readonly logger: ILogger
  ) {
    this.log = this.logger.child({ module: 'email-queue' });
    this.queue = new Queue<IEmailJobData, IEmailJobResult>(EMAIL_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100, age: 24 * 3600 },
        removeOnFail: { count: 500, age: 7 * 24 * 3600 }
      }
    });

    this.queue.on('error', (err) => {
      this.log.error({ err }, 'email queue error');
    });
  }

  async add(data: IEmailJobData) {
    await this.queue.add('send-email', data);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
