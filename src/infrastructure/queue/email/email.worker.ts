import { IEmailJobData, IEmailJobResult } from '@/application/ports/email-job.port';
import { ILogger } from '@/application/ports/logger.port';
import { EMAIL_QUEUE_NAME } from '@/infrastructure/queue/email/email.type';

import { IEmailService } from '@/infrastructure/services/email.service';

import { Worker, type ConnectionOptions, type Job } from 'bullmq';

export interface IEmailWorker {
  run(connection: ConnectionOptions): Worker<IEmailJobData, IEmailJobResult>;
}

// Consumer
export class EmailWorker implements IEmailWorker {
  private readonly log: ILogger;
  constructor(
    private readonly emailService: IEmailService,
    private readonly logger: ILogger
  ) {
    this.log = this.logger.child({ module: 'email-worker' });
  }

  private async processEmailJob(job: Job<IEmailJobData, IEmailJobResult>): Promise<IEmailJobResult> {
    const { toAddress, subject, body, template } = job.data;
    await this.emailService.sendEmail({ toAddress, subject, body, template });
    return { sentAt: new Date().toISOString() };
  }

  public run(connection: ConnectionOptions): Worker<IEmailJobData, IEmailJobResult> {
    const worker = new Worker<IEmailJobData, IEmailJobResult>(EMAIL_QUEUE_NAME, this.processEmailJob.bind(this), {
      connection,
      concurrency: 5
    });

    worker.on('completed', (job) => {
      this.log.info({ jobId: job.id }, 'job completed');
    });

    worker.on('failed', (job, err) => {
      this.log.error({ err, jobId: job?.id, attemptsMade: job?.attemptsMade }, 'job failed');
    });

    worker.on('error', (err) => {
      this.log.error({ err }, 'worker error');
    });

    return worker;
  }
}
