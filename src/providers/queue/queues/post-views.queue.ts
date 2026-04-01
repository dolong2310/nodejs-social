import { Injectable } from '@/decorators/injectable.decorator';
import { LoggerInstance } from '@/providers/logger/instance.logger';
import { IPostViewsJobData, IPostViewsJobResult, QUEUE_NAMES } from '@/providers/queue/types';
import { Queue, type ConnectionOptions } from 'bullmq';

const log = LoggerInstance.getLogger().child({ module: 'post-views-queue' });

export interface IPostViewsJobQueue {
  add(data: IPostViewsJobData): Promise<void>;
  close(): Promise<void>;
}

@Injectable()
export class PostViewsJobQueue implements IPostViewsJobQueue {
  private readonly queue: Queue<IPostViewsJobData, IPostViewsJobResult>;

  constructor(connection: ConnectionOptions) {
    this.queue = new Queue<IPostViewsJobData, IPostViewsJobResult>(QUEUE_NAMES.POST_VIEWS, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { count: 1000, age: 24 * 3600 },
        removeOnFail: { count: 500, age: 7 * 24 * 3600 }
      }
    });
    this.queue.on('error', (err) => {
      log.error({ err }, 'post views queue error');
    });
  }

  async add(data: IPostViewsJobData): Promise<void> {
    await this.queue.add('increment-views', data);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
