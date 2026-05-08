import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import {
  IPostViewsJobData,
  IPostViewsJobResult,
  PostViewsQueuePort
} from '@/modules/post/application/ports/post-views-job.port';
import { Queue, type ConnectionOptions } from 'bullmq';

export const POST_VIEWS_QUEUE_NAME = 'post-views';

export class BullMQPostViewsQueue implements PostViewsQueuePort {
  private readonly queue: Queue<IPostViewsJobData, IPostViewsJobResult>;
  private readonly log: LoggerPort;

  constructor(
    readonly connection: ConnectionOptions,
    private readonly logger: LoggerPort
  ) {
    this.log = this.logger.child({ module: 'post-views-queue' });
    this.queue = new Queue<IPostViewsJobData, IPostViewsJobResult>(POST_VIEWS_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { count: 1000, age: 24 * 3600 },
        removeOnFail: { count: 500, age: 7 * 24 * 3600 }
      }
    });
    this.queue.on('error', (err) => {
      this.log.error({ err }, 'post views queue error');
    });
  }

  async add(data: IPostViewsJobData): Promise<void> {
    await this.queue.add('increment-views', data);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
