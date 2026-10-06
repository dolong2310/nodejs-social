import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import {
  VIDEO_STREAM_QUEUE_NAME,
  type VideoStreamJobData,
  type VideoStreamJobResult
} from '@/modules/media/application/ports/video-stream-job.port';
import {
  EncodeVideoStreamInputPort,
  type EncodeVideoStreamPort
} from '@/modules/media/application/use-cases/encode-video-stream/encode-video-stream.port';
import {
  MarkVideoEncodingFailedInputPort,
  type MarkVideoEncodingFailedPort
} from '@/modules/media/application/use-cases/mark-video-encoding-failed/mark-video-encoding-failed.port';
import { BaseWorker } from '@/presentation/worker/core/base.worker';
import type { ConnectionOptions, Job } from 'bullmq';
import { get } from 'lodash-es';

// Consumer
export class VideoStreamWorker extends BaseWorker<VideoStreamJobData, VideoStreamJobResult> {
  private readonly log: LoggerPort;

  constructor(
    protected readonly connection: ConnectionOptions,
    private readonly encodeVideoStreamUC: EncodeVideoStreamPort,
    private readonly markVideoEncodingFailedUC: MarkVideoEncodingFailedPort,
    private readonly logger: LoggerPort
  ) {
    super({ name: VIDEO_STREAM_QUEUE_NAME, workerOptions: { connection, concurrency: 2 } });

    this.log = this.logger.child({ module: 'video-stream-worker' });

    this.worker.on('failed', async (job, err) => {
      const jobId = get(job, 'id', '');
      const idName = get(job, 'data.idName', '');
      const attemptsMade = get(job, 'attemptsMade', 0);
      const jobOptsAttempts = get(job, 'opts.attempts', 1);
      const message = get(err, 'message', '');
      this.log.error({ jobId, idName, attemptsMade, err }, 'worker:::failed');
      if (job && attemptsMade >= jobOptsAttempts) {
        await this.markVideoEncodingFailedUC
          .execute(new MarkVideoEncodingFailedInputPort({ idName, message }))
          .catch((dbErr) => this.log.error({ err: dbErr, idName }, 'worker:::failed-to-mark-video-as-failed-in-db'));
      }
    });
  }

  protected override async process(
    job: Job<VideoStreamJobData, VideoStreamJobResult, string>
  ): Promise<VideoStreamJobResult> {
    const result = await this.encodeVideoStreamUC.execute(
      new EncodeVideoStreamInputPort({ filepath: job.data.filepath, idName: job.data.idName })
    );
    return { idName: result.idName };
  }
}
