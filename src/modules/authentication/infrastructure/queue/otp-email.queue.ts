import {
  OtpEmailJobData,
  OtpEmailJobResult,
  OtpEmailQueuePort
} from '@/modules/authentication/application/ports/otp-email-job.port';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { Queue, type ConnectionOptions } from 'bullmq';

export const OTP_EMAIL_QUEUE_NAME = 'email';

export class BullMQOtpEmailQueue implements OtpEmailQueuePort {
  private readonly queue: Queue<OtpEmailJobData, OtpEmailJobResult>;
  private readonly log: LoggerPort;

  constructor(
    readonly connection: ConnectionOptions,
    private readonly logger: LoggerPort
  ) {
    this.log = this.logger.child({ module: 'otp-email-queue' });
    this.queue = new Queue<OtpEmailJobData, OtpEmailJobResult>(OTP_EMAIL_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100, age: 24 * 3600 },
        removeOnFail: { count: 500, age: 7 * 24 * 3600 }
      }
    });

    this.queue.on('error', (err) => {
      this.log.error({ err }, 'OTP email queue error');
    });
  }

  async add(data: OtpEmailJobData): Promise<void> {
    await this.queue.add('send-otp-email', data);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
