import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import {
  SYSTEM_HEALTH_SCHEDULE_QUEUE_NAME,
  type SystemHealthJobData,
  type SystemHealthJobResult
} from '@/modules/operations/application/ports/system-health-job.port';
import type { CheckSystemHealthPort } from '@/modules/operations/application/use-cases/check-system-health/check-system-health.port';
import { BaseWorker } from '@/presentation/worker/core/base.worker';
import type { ConnectionOptions, Job } from 'bullmq';

export class SystemHealthWorker extends BaseWorker<SystemHealthJobData, SystemHealthJobResult> {
  private readonly log: LoggerPort;

  constructor(
    protected readonly connection: ConnectionOptions,
    private readonly checkSystemHealthUC: CheckSystemHealthPort,
    private readonly logger: LoggerPort
  ) {
    super({ name: SYSTEM_HEALTH_SCHEDULE_QUEUE_NAME, workerOptions: { connection, concurrency: 1 } });
    this.log = this.logger.child({ module: 'system-health-worker' });
  }

  protected override async process(
    job: Job<SystemHealthJobData, SystemHealthJobResult>
  ): Promise<SystemHealthJobResult> {
    const result = await this.checkSystemHealthUC.execute(job.data);
    this.log.info({ jobId: job.id, status: result.status, alertsSent: result.alertsSent }, 'worker:::system-health');
    return result;
  }
}
