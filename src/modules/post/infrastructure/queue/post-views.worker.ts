import { BaseWorker } from '@/infrastructure/queue/bullmq/base.worker';
import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import type { PostViewsJobData, PostViewsJobResult } from '@/modules/post/application/ports/post-views-job.port';
import type { PostCommandRepositoryPort } from '@/modules/post/domain/repositories/post.command.repository';
import { POST_VIEWS_QUEUE_NAME } from '@/modules/post/infrastructure/queue/post-views.queue';
import type { ConnectionOptions, Job } from 'bullmq';

export class PostViewsWorker extends BaseWorker<PostViewsJobData, PostViewsJobResult> {
  private readonly log: LoggerPort;

  constructor(
    protected readonly connection: ConnectionOptions,
    private readonly postCommandRepository: PostCommandRepositoryPort,
    private readonly logger: LoggerPort
  ) {
    super({ name: POST_VIEWS_QUEUE_NAME, workerOptions: { connection, concurrency: 5 } });
    this.log = this.logger.child({ module: 'post-views-worker' });
  }

  protected override async process(job: Job<PostViewsJobData, PostViewsJobResult>): Promise<PostViewsJobResult> {
    const postIds = [...new Set(job.data.postIds)];
    if (postIds.length === 0) {
      return { updatedCount: 0 };
    }
    const updatedCount = await this.postCommandRepository.increasePostsViews({
      ids: postIds,
      isAuthenticatedUser: job.data.isAuthenticatedUser
    });
    return { updatedCount };
  }
}
