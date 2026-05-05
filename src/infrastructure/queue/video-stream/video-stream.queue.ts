import {
  IVideoStreamJobData,
  IVideoStreamJobResult,
  VideoStreamQueuePort
} from '@/modules/media/application/ports/video-stream-job.port';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { Queue, type ConnectionOptions } from 'bullmq';

export const VIDEO_STREAM_QUEUE_NAME = 'video-stream';

// Producer
export class BullMQVideoStreamQueue implements VideoStreamQueuePort {
  private readonly queue: Queue<IVideoStreamJobData, IVideoStreamJobResult>;
  private readonly log: LoggerPort;

  constructor(
    readonly connection: ConnectionOptions,
    private readonly logger: LoggerPort
  ) {
    this.log = this.logger.child({ module: 'video-stream-queue' });
    this.queue = new Queue<IVideoStreamJobData, IVideoStreamJobResult>(VIDEO_STREAM_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 50, age: 24 * 3600 },
        removeOnFail: { count: 200, age: 7 * 24 * 3600 }
      }
    });

    this.queue.on('error', (err) => {
      this.log.error({ err }, 'video stream queue error');
    });
  }

  async add(data: IVideoStreamJobData): Promise<void> {
    await this.queue.add('encode-stream', data);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
