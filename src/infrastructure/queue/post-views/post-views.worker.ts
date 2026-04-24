import { LoggerPort } from '@/application/ports/logger.port';
import { IPostViewsJobData, IPostViewsJobResult } from '@/application/ports/post-views-job.port';
import { PostRepositoryPort } from '@/domain/repositories/post/post.repository';
import { POST_VIEWS_QUEUE_NAME } from '@/infrastructure/queue/post-views/post-views.type';
import { Worker, type ConnectionOptions, type Job } from 'bullmq';

export interface IPostViewsWorker {
  run(connection: ConnectionOptions): Worker<IPostViewsJobData, IPostViewsJobResult>;
}

export class PostViewsWorker implements IPostViewsWorker {
  private readonly log: LoggerPort;

  constructor(
    private readonly postRepository: PostRepositoryPort,
    private readonly logger: LoggerPort
  ) {
    this.log = this.logger.child({ module: 'post-views-worker' });
  }

  private async processPostViewsJob(job: Job<IPostViewsJobData, IPostViewsJobResult>): Promise<IPostViewsJobResult> {
    const postIds = [...new Set(job.data.postIds)];
    if (postIds.length === 0) {
      return { updatedCount: 0 };
    }
    const updatedCount = await this.postRepository.increasePostsViews({
      ids: postIds,
      isAuthenticatedViewer: job.data.isAuthenticatedViewer
    });
    return { updatedCount };
  }

  public run(connection: ConnectionOptions): Worker<IPostViewsJobData, IPostViewsJobResult> {
    const worker = new Worker<IPostViewsJobData, IPostViewsJobResult>(POST_VIEWS_QUEUE_NAME, this.processPostViewsJob, {
      connection,
      concurrency: 5
    });

    worker.on('failed', (job, err) => {
      this.log.error({ err, jobId: job?.id, attemptsMade: job?.attemptsMade }, 'post views job failed');
    });
    worker.on('error', (err) => {
      this.log.error({ err }, 'post views worker error');
    });
    return worker;
  }
}
