import { IEmailJobData, IEmailJobResult, IEmailQueue } from '@/modules/core/application/ports/email-job.port';
import { LoggerPort } from '@/modules/core/infrastructure/logger/logger.port';
import { Queue, type ConnectionOptions } from 'bullmq';

export const EMAIL_QUEUE_NAME = 'email';

export class BullMQEmailQueue implements IEmailQueue {
  private readonly queue: Queue<IEmailJobData, IEmailJobResult>;
  private readonly log: LoggerPort;

  constructor(
    readonly connection: ConnectionOptions,
    private readonly logger: LoggerPort
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
