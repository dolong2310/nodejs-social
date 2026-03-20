import { logger } from '@/logger';
import { IEmailJobResult, QUEUE_NAMES } from '@/queue/types';
import EmailService from '@/services/email.service';
import { IEmailPayload } from '@/types/mail.type';
import { Worker, type ConnectionOptions, type Job } from 'bullmq';

const log = logger.child({ module: 'email-worker' });

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
      log.info({ jobId: job.id }, 'job completed');
    });

    worker.on('failed', (job, err) => {
      log.error({ err, jobId: job?.id, attemptsMade: job?.attemptsMade }, 'job failed');
    });

    worker.on('error', (err) => {
      log.error({ err }, 'worker error');
    });

    return worker;
  }
}
