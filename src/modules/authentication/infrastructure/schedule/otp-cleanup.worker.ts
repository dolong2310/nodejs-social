import { BaseWorker } from '@/infrastructure/queue/bullmq/base.worker';
import {
  IOtpCleanupJobData,
  IOtpCleanupJobResult
} from '@/modules/authentication/application/ports/otp-cleanup-job.port';
import {
  DeleteExpiredOtpsCommand,
  DeleteExpiredOtpsPort
} from '@/modules/authentication/application/use-cases/delete-expired-otps/delete-expired-otps.port';
import { OTP_CLEANUP_SCHEDULE_QUEUE_NAME } from '@/modules/authentication/infrastructure/schedule/otp-cleanup.schedule';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { type ConnectionOptions, type Job } from 'bullmq';

export class OtpCleanupWorker extends BaseWorker<IOtpCleanupJobData, IOtpCleanupJobResult> {
  private readonly log: LoggerPort;

  constructor(
    protected readonly connection: ConnectionOptions,
    private readonly deleteExpiredOtpsUC: DeleteExpiredOtpsPort,
    private readonly logger: LoggerPort
  ) {
    super({ name: OTP_CLEANUP_SCHEDULE_QUEUE_NAME, workerOptions: { connection, concurrency: 1 } });

    this.log = this.logger.child({ module: 'otp-cleanup-worker' });
  }

  protected override async process(job: Job<IOtpCleanupJobData, IOtpCleanupJobResult>): Promise<IOtpCleanupJobResult> {
    const result = await this.deleteExpiredOtpsUC.execute(new DeleteExpiredOtpsCommand());
    this.log.info({ jobId: job.id, deletedCount: result.deletedCount }, 'expired OTPs deleted');
    return { deletedCount: result.deletedCount };
  }
}
