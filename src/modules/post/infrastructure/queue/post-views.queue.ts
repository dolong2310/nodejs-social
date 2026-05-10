import { BaseQueue } from '@/infrastructure/queue/bullmq/base.queue';
import {
  PostViewsJobData,
  PostViewsJobResult,
  PostViewsQueuePort
} from '@/modules/post/application/ports/post-views-job.port';
import { type ConnectionOptions } from 'bullmq';

export const POST_VIEWS_QUEUE_NAME = 'post-views';

export class PostViewsQueue extends BaseQueue<PostViewsJobData, PostViewsJobResult> implements PostViewsQueuePort {
  constructor(readonly connection: ConnectionOptions) {
    super({
      name: POST_VIEWS_QUEUE_NAME,
      queueOptions: {
        connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { count: 1000, age: 24 * 3600 },
          removeOnFail: { count: 500, age: 7 * 24 * 3600 }
        }
      }
    });
  }

  async add(data: PostViewsJobData): Promise<void> {
    await this.queue.add('increment-views', data);
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
