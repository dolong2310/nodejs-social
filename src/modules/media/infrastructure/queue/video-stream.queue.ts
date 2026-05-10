import { BaseQueue } from '@/infrastructure/queue/bullmq/base.queue';
import {
  VideoStreamJobData,
  VideoStreamJobResult,
  VideoStreamQueuePort
} from '@/modules/media/application/ports/video-stream-job.port';
import { type ConnectionOptions } from 'bullmq';

export const VIDEO_STREAM_QUEUE_NAME = 'video-stream';

// Producer
export class VideoStreamQueue
  extends BaseQueue<VideoStreamJobData, VideoStreamJobResult>
  implements VideoStreamQueuePort
{
  constructor(readonly connection: ConnectionOptions) {
    super({
      name: VIDEO_STREAM_QUEUE_NAME,
      queueOptions: {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: { count: 50, age: 24 * 3600 },
          removeOnFail: { count: 200, age: 7 * 24 * 3600 }
        }
      }
    });
  }

  async add(data: VideoStreamJobData): Promise<void> {
    await this.queue.add('encode-stream', data);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
