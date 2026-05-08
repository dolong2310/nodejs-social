import { OtpEmailJobData, OtpEmailJobResult } from '@/modules/authentication/application/ports/otp-email-job.port';
import { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';
import { SesOtpEmailSender } from '@/modules/authentication/infrastructure/email/ses-otp-email-sender';
import { OTP_EMAIL_QUEUE_NAME } from '@/modules/authentication/infrastructure/queue/otp-email.queue';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { UnrecoverableError, Worker, type ConnectionOptions, type Job } from 'bullmq';

// Consumer
export class OtpEmailWorker {
  private readonly log: LoggerPort;
  constructor(
    private readonly otpEmailSender: SesOtpEmailSender,
    private readonly otpRepository: OtpRepositoryPort,
    private readonly logger: LoggerPort
  ) {
    this.log = this.logger.child({ module: 'otp-email-worker' });
  }

  private async processEmailJob(job: Job<OtpEmailJobData, OtpEmailJobResult>): Promise<OtpEmailJobResult> {
    await this.otpEmailSender.sendOtpEmail({
      toAddress: job.data.toAddress,
      subject: job.data.subject,
      code: job.data.body.code
    });
    return { sentAt: new Date().toISOString() };
  }

  /**
   * After `moveToFailed`, BullMQ increments `attemptsMade`. Remove OTP only when the job will not retry
   * (attempts exhausted) or failed with `UnrecoverableError`.
   */
  private async cleanupOtpIfEmailFailedPermanently(
    job: Job<OtpEmailJobData, OtpEmailJobResult> | undefined,
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

  public run(connection: ConnectionOptions): Worker<OtpEmailJobData, OtpEmailJobResult> {
    const worker = new Worker<OtpEmailJobData, OtpEmailJobResult>(
      OTP_EMAIL_QUEUE_NAME,
      this.processEmailJob.bind(this),
      {
        connection,
        concurrency: 5
      }
    );

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
