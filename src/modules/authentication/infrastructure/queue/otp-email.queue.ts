import { BaseQueue } from '@/infrastructure/queue/bullmq/base.queue';
import {
  OtpEmailJobData,
  OtpEmailJobResult,
  OtpEmailQueuePort
} from '@/modules/authentication/application/ports/otp-email-job.port';
import { type ConnectionOptions } from 'bullmq';

export const OTP_EMAIL_QUEUE_NAME = 'email';

export class OtpEmailQueue extends BaseQueue<OtpEmailJobData, OtpEmailJobResult> implements OtpEmailQueuePort {
  constructor(readonly connection: ConnectionOptions) {
    super({
      name: OTP_EMAIL_QUEUE_NAME,
      queueOptions: {
        connection,
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { count: 100, age: 24 * 3600 },
          removeOnFail: { count: 500, age: 7 * 24 * 3600 }
        }
      }
    });
  }

  async add(data: OtpEmailJobData): Promise<void> {
    await this.queue.add('send-otp-email', data);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
