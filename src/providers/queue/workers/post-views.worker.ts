import { AutoBind } from '@/decorators/autoBind.decorator';
import { PostRepository } from '@/modules/posts/posts.repository';
import { Container } from '@/providers/container/instance.container';
import { LoggerInstance } from '@/providers/logger/instance.logger';
import { IPostViewsJobData, IPostViewsJobResult, QUEUE_NAMES } from '@/providers/queue/types';
import { Worker, type ConnectionOptions, type Job } from 'bullmq';

const log = LoggerInstance.getLogger().child({ module: 'post-views-worker' });

export class PostViewsWorker {
  private get postRepository() {
    return Container.get().get(PostRepository);
  }

  @AutoBind()
  private async processPostViewsJob(job: Job<IPostViewsJobData, IPostViewsJobResult>): Promise<IPostViewsJobResult> {
    const postIds = [...new Set(job.data.postIds)];
    if (postIds.length === 0) {
      return { updatedCount: 0 };
    }
    const updatedCount = await this.postRepository.incrementViewsByIds(postIds, job.data.isAuthenticatedViewer);
    return { updatedCount };
  }

  public createWorker(connection: ConnectionOptions): Worker<IPostViewsJobData, IPostViewsJobResult> {
    const worker = new Worker<IPostViewsJobData, IPostViewsJobResult>(
      QUEUE_NAMES.POST_VIEWS,
      this.processPostViewsJob,
      {
        connection,
        concurrency: 5
      }
    );

    worker.on('failed', (job, err) => {
      log.error({ err, jobId: job?.id, attemptsMade: job?.attemptsMade }, 'post views job failed');
    });
    worker.on('error', (err) => {
      log.error({ err }, 'post views worker error');
    });
    return worker;
  }
}
