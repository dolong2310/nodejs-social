import { EMAIL_QUEUE_NAME } from '@/infrastructure/queue/email/email.queue';
import { EmailServicePort } from '@/infrastructure/services/email.service';
import { IEmailJobData, IEmailJobResult } from '@/modules/auth/application/ports/email-job.port';
import { OtpRepositoryPort } from '@/modules/auth/domain/repositories/otp.repository';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { UnrecoverableError, Worker, type ConnectionOptions, type Job } from 'bullmq';

// Consumer
export class EmailWorker {
  private readonly log: LoggerPort;
  constructor(
    private readonly emailService: EmailServicePort,
    private readonly otpRepository: OtpRepositoryPort,
    private readonly logger: LoggerPort
  ) {
    this.log = this.logger.child({ module: 'email-worker' });
  }

  private async processEmailJob(job: Job<IEmailJobData, IEmailJobResult>): Promise<IEmailJobResult> {
    await this.emailService.sendEmail(job.data);
    return { sentAt: new Date().toISOString() };
  }

  /**
   * After `moveToFailed`, BullMQ increments `attemptsMade`. Remove OTP only when the job will not retry
   * (attempts exhausted) or failed with `UnrecoverableError`.
   */
  private async cleanupOtpIfEmailFailedPermanently(
    job: Job<IEmailJobData, IEmailJobResult> | undefined,
    err: Error
  ): Promise<void> {
    const otpId = job?.data.body.otpId;
    if (!job || !otpId) {
      return;
    }
    const maxAttempts = job.opts.attempts ?? 1;
    const attemptsExhausted = job.attemptsMade >= maxAttempts;
    const unrecoverable = err instanceof UnrecoverableError;
    if (!attemptsExhausted && !unrecoverable) {
      return;
    }
    try {
      await this.otpRepository.deleteOtp(otpId);
      this.log.info({ otpId, bullJobId: job.id }, 'deleted OTP after email job permanently failed');
    } catch (cleanupErr) {
      this.log.error({ err: cleanupErr, otpId }, 'failed to delete OTP after email job failure');
    }
  }

  public run(connection: ConnectionOptions): Worker<IEmailJobData, IEmailJobResult> {
    const worker = new Worker<IEmailJobData, IEmailJobResult>(EMAIL_QUEUE_NAME, this.processEmailJob.bind(this), {
      connection,
      concurrency: 5
    });

    worker.on('completed', (job) => {
      this.log.info({ jobId: job.id }, 'job completed');
    });

    worker.on('failed', async (job, err) => {
      this.log.error({ err, jobId: job?.id, attemptsMade: job?.attemptsMade }, 'job failed');
      await this.cleanupOtpIfEmailFailedPermanently(job, err);
    });

    worker.on('error', (err) => {
      this.log.error({ err }, 'worker error');
    });

    return worker;
  }
}
