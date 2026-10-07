import {
  POST_VIEWS_QUEUE_NAME,
  type PostViewsJobData,
  type PostViewsJobResult
} from '@/modules/post/application/ports/post-views-job.port';
import {
  IncreasePostsViewsInputPort,
  type IncreasePostsViewsPort
} from '@/modules/post/application/use-cases/increase-posts-views/increase-posts-views.port';
import { BaseWorker } from '@/presentation/worker/core/base.worker';
import type { ConnectionOptions, Job } from 'bullmq';

export class PostViewsWorker extends BaseWorker<PostViewsJobData, PostViewsJobResult> {
  constructor(
    protected readonly connection: ConnectionOptions,
    private readonly increasePostsViewsUC: IncreasePostsViewsPort
  ) {
    super({ name: POST_VIEWS_QUEUE_NAME, workerOptions: { connection, concurrency: 5 } });
  }

  protected override async process(job: Job<PostViewsJobData, PostViewsJobResult>): Promise<PostViewsJobResult> {
    const result = await this.increasePostsViewsUC.execute(
      new IncreasePostsViewsInputPort({
        postIds: job.data.postIds,
        isAuthenticatedUser: job.data.isAuthenticatedUser
      })
    );
    return { updatedCount: result.updatedCount };
  }
}
