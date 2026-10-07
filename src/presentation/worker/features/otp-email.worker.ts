import {
  OTP_EMAIL_QUEUE_NAME,
  type OtpEmailJobData,
  type OtpEmailJobResult
} from '@/modules/authentication/application/ports/otp-email-job.port';
import {
  DeleteOtpInputPort,
  type DeleteOtpPort
} from '@/modules/authentication/application/use-cases/delete-otp/delete-otp.port';
import {
  SendOtpEmailInputPort,
  type SendOtpEmailPort
} from '@/modules/authentication/application/use-cases/send-otp-email/send-otp-email.port';
import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { BaseWorker } from '@/presentation/worker/core/base.worker';
import { UnrecoverableError, type ConnectionOptions, type Job } from 'bullmq';

// Consumer
export class OtpEmailWorker extends BaseWorker<OtpEmailJobData, OtpEmailJobResult> {
  private readonly log: LoggerPort;

  constructor(
    protected readonly connection: ConnectionOptions,
    private readonly sendOtpEmailUC: SendOtpEmailPort,
    private readonly deleteOtpUC: DeleteOtpPort,
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
    const result = await this.sendOtpEmailUC.execute(
      new SendOtpEmailInputPort({
        toAddress: job.data.toAddress,
        subject: job.data.subject,
        code: job.data.body.code
      })
    );
    return { sentAt: result.sentAt };
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
      await this.deleteOtpUC.execute(new DeleteOtpInputPort({ otpId }));
      this.log.info({ otpId, bullJobId: job.id }, 'worker:::deleted-otp-after-email-job-permanently-failed');
    } catch (cleanupErr) {
      this.log.error({ err: cleanupErr, otpId }, 'worker:::failed-to-delete-otp-after-email-job-failure');
    }
  }
}
