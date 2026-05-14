import { BaseWorker } from '@/infrastructure/queue/bullmq/base.worker';
import {
  RefreshTokenCleanupJobData,
  RefreshTokenCleanupJobResult
} from '@/modules/authentication/application/ports/refresh-token-cleanup-job.port';
import {
  DeleteExpiredRefreshTokensCommand,
  DeleteExpiredRefreshTokensPort
} from '@/modules/authentication/application/use-cases/delete-expired-refresh-tokens/delete-expired-refresh-tokens.port';
import { REFRESH_TOKEN_CLEANUP_SCHEDULE_QUEUE_NAME } from '@/modules/authentication/infrastructure/schedule/refresh-token-cleanup.schedule';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { type ConnectionOptions, type Job } from 'bullmq';

export class RefreshTokenCleanupWorker extends BaseWorker<RefreshTokenCleanupJobData, RefreshTokenCleanupJobResult> {
  private readonly log: LoggerPort;

  constructor(
    protected readonly connection: ConnectionOptions,
    private readonly deleteExpiredRefreshTokensUC: DeleteExpiredRefreshTokensPort,
    private readonly logger: LoggerPort
  ) {
    super({ name: REFRESH_TOKEN_CLEANUP_SCHEDULE_QUEUE_NAME, workerOptions: { connection, concurrency: 1 } });

    this.log = this.logger.child({ module: 'refresh-token-cleanup-worker' });
  }

  protected override async process(
    job: Job<RefreshTokenCleanupJobData, RefreshTokenCleanupJobResult>
  ): Promise<RefreshTokenCleanupJobResult> {
    const result = await this.deleteExpiredRefreshTokensUC.execute(new DeleteExpiredRefreshTokensCommand());
    this.log.info({ jobId: job.id, deletedCount: result.deletedCount }, 'expired refresh tokens deleted');
    return { deletedCount: result.deletedCount };
  }
}
