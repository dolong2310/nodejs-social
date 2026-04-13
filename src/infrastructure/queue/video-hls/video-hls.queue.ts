import { ILogger } from '@/application/ports/logger.port';
import { IVideoHLSJobData, IVideoHLSJobResult, IVideoHLSQueue } from '@/application/ports/video-hls-job.port';

import { VIDEO_HLS_QUEUE_NAME } from '@/infrastructure/queue/video-hls/video-hls.type';

import { Queue, type ConnectionOptions } from 'bullmq';

// Producer
export class BullMQVideoHLSQueue implements IVideoHLSQueue {
  private readonly queue: Queue<IVideoHLSJobData, IVideoHLSJobResult>;
  private readonly log: ILogger;

  constructor(
    readonly connection: ConnectionOptions,
    private readonly logger: ILogger
  ) {
    this.log = this.logger.child({ module: 'video-hls-queue' });
    this.queue = new Queue<IVideoHLSJobData, IVideoHLSJobResult>(VIDEO_HLS_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 50, age: 24 * 3600 },
        removeOnFail: { count: 200, age: 7 * 24 * 3600 }
      }
    });

    this.queue.on('error', (err) => {
      this.log.error({ err }, 'video hls queue error');
    });
  }

  async add(data: IVideoHLSJobData): Promise<void> {
    await this.queue.add('encode-hls', data);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
