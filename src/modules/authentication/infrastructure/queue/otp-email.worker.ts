import { BaseWorker } from '@/infrastructure/queue/bullmq/base.worker';
import { OtpEmailJobData, OtpEmailJobResult } from '@/modules/authentication/application/ports/otp-email-job.port';
import { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';
import { SesOtpEmailSender } from '@/modules/authentication/infrastructure/email/ses-otp-email-sender';
import { OTP_EMAIL_QUEUE_NAME } from '@/modules/authentication/infrastructure/queue/otp-email.queue';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { UnrecoverableError, type ConnectionOptions, type Job } from 'bullmq';

// Consumer
export class OtpEmailWorker extends BaseWorker<OtpEmailJobData, OtpEmailJobResult> {
  private readonly log: LoggerPort;

  constructor(
    protected readonly connection: ConnectionOptions,
    private readonly otpEmailSender: SesOtpEmailSender,
    private readonly otpRepository: OtpRepositoryPort,
    private readonly logger: LoggerPort
  ) {
    super({ name: OTP_EMAIL_QUEUE_NAME, workerOptions: { connection, concurrency: 5 } });

    this.log = this.logger.child({ module: 'otp-email-worker' });

    this.worker.on('failed', async (job, err) => {
      this.log.error({ err, jobId: job?.id, attemptsMade: job?.attemptsMade }, 'worker:::failed');
      await this.cleanupOtpIfEmailFailedPermanently(job, err);
    });
  }

  protected override async process(job: Job<OtpEmailJobData, OtpEmailJobResult>): Promise<OtpEmailJobResult> {
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
      this.log.info({ otpId, bullJobId: job.id }, 'worker:::deleted-otp-after-email-job-permanently-failed');
    } catch (cleanupErr) {
      this.log.error({ err: cleanupErr, otpId }, 'worker:::failed-to-delete-otp-after-email-job-failure');
    }
  }
}
