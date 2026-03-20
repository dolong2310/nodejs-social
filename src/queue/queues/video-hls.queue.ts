import { QUEUE_NAMES, IVideoHLSJobResult } from '@/queue/types';
import { IVideoHLSJobData } from '@/types/media.type';
import { Queue, type ConnectionOptions } from 'bullmq';

export interface IVideoHLSJobQueue {
  add(data: IVideoHLSJobData): Promise<void>;
  close(): Promise<void>;
}

// Producer
export class VideoHLSJobQueue implements IVideoHLSJobQueue {
  private readonly queue: Queue<IVideoHLSJobData, IVideoHLSJobResult>;

  constructor(connection: ConnectionOptions) {
    this.queue = new Queue<IVideoHLSJobData, IVideoHLSJobResult>(QUEUE_NAMES.VIDEO_HLS, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 50, age: 24 * 3600 },
        removeOnFail: { count: 200, age: 7 * 24 * 3600 }
      }
    });

    this.queue.on('error', (err) => {
      console.error('\x1b[31m%s\x1b[0m', `[VideoHLSQueue] ${err.message}`);
    });
  }

  async add(data: IVideoHLSJobData): Promise<void> {
    await this.queue.add('encode-hls', data);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
