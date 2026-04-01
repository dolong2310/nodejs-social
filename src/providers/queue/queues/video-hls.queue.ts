import { Injectable } from '@/decorators/injectable.decorator';
import { IVideoHLSJobData } from '@/interfaces/types/media.type';
import { LoggerInstance } from '@/providers/logger/instance.logger';
import { IVideoHLSJobResult, QUEUE_NAMES } from '@/providers/queue/types';
import { Queue, type ConnectionOptions } from 'bullmq';

const log = LoggerInstance.getLogger().child({ module: 'video-hls-queue' });

export interface IVideoHLSJobQueue {
  add(data: IVideoHLSJobData): Promise<void>;
  close(): Promise<void>;
}

// Producer
@Injectable()
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
      log.error({ err }, 'video hls queue error');
    });
  }

  async add(data: IVideoHLSJobData): Promise<void> {
    await this.queue.add('encode-hls', data);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
