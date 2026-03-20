import { IEmailJobResult, QUEUE_NAMES } from '@/queue/types';
import EmailService from '@/services/email.service';
import { IEmailPayload } from '@/types/mail.type';
import { Worker, type ConnectionOptions, type Job } from 'bullmq';

export interface IEmailWorker {
  createWorker(connection: ConnectionOptions): Worker<IEmailPayload, IEmailJobResult>;
}

// Consumer
export class EmailWorker implements IEmailWorker {
  private readonly emailService = new EmailService();

  private async processEmailJob(job: Job<IEmailPayload, IEmailJobResult>): Promise<IEmailJobResult> {
    const { toAddress, subject, body, template } = job.data;
    await this.emailService.sendEmail({ toAddress, subject, body, template });
    return { sentAt: new Date().toISOString() };
  }

  public createWorker(connection: ConnectionOptions): Worker<IEmailPayload, IEmailJobResult> {
    const worker = new Worker<IEmailPayload, IEmailJobResult>(QUEUE_NAMES.EMAIL, this.processEmailJob.bind(this), {
      connection,
      concurrency: 5
    });

    worker.on('completed', (job) => {
      console.log('\x1b[32m%s\x1b[0m', `[EmailWorker] Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      console.error(
        '\x1b[31m%s\x1b[0m',
        `[EmailWorker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`
      );
    });

    worker.on('error', (err) => {
      console.error('\x1b[31m%s\x1b[0m', `[EmailWorker] ${err.message}`);
    });

    return worker;
  }
}
