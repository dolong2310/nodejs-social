import { mapWithConcurrency } from '@/application/common/utils/concurrency.util';
import { encodeStreamWithMultipleVideoStreams } from '@/application/common/utils/video.util';
import { IFileStorage } from '@/application/ports/file-storage.port';
import { LoggerPort } from '@/application/ports/logger.port';
import { IMimeService } from '@/application/ports/mime.port';
import { IPathService } from '@/application/ports/path.port';
import { IS3Service } from '@/application/ports/s3.port';
import { IVideoStreamJobData, IVideoStreamJobResult } from '@/application/ports/video-stream-job.port';
import { EEncodingVideoStatus } from '@/domain/entities/video-status/video-status.type';
import { VideoStatusRepositoryPort } from '@/domain/repositories/video-status/video-status.repository';
import { VIDEO_STREAM_QUEUE_NAME } from '@/infrastructure/queue/video-stream/video-stream.type';
import { UPLOAD_DIR_VIDEO } from '@/presentation/http/constants/file.constant'; // TODO: move to infrastructure layer
import { Worker, type ConnectionOptions, type Job } from 'bullmq';
import { get } from 'lodash-es';

export interface IVideoStreamWorker {
  run(connection: ConnectionOptions): Worker<IVideoStreamJobData, IVideoStreamJobResult>;
}

// Consumer
export class VideoStreamWorker implements IVideoStreamWorker {
  private readonly log: LoggerPort;

  constructor(
    private readonly mediaRepository: VideoStatusRepositoryPort,
    private readonly s3Service: IS3Service,
    private readonly fileStorage: IFileStorage,
    private readonly mimeService: IMimeService,
    private readonly pathService: IPathService,
    private readonly logger: LoggerPort
  ) {
    this.log = this.logger.child({ module: 'video-stream-worker' });
  }

  private async processVideoStreamJob(
    job: Job<IVideoStreamJobData, IVideoStreamJobResult>
  ): Promise<IVideoStreamJobResult> {
    const { filepath, idName } = job.data;

    await this.mediaRepository.updateVideoStatus({ name: idName, status: EEncodingVideoStatus.PROCESSING });
    await job.updateProgress(10);

    await encodeStreamWithMultipleVideoStreams(filepath);
    await job.updateProgress(60);

    await this.fileStorage.delete(filepath);

    const folderPath = this.pathService.resolve(UPLOAD_DIR_VIDEO, idName);
    const filepaths = await getFiles({ fileStorage: this.fileStorage, pathService: this.pathService, dir: folderPath });
    const concurrency = 2;

    // Upload các segment sang S3 với giới hạn concurrency để tránh bão hòa network/CPU.
    await mapWithConcurrency(filepaths, concurrency, async (_filepath) => {
      const filename = 'videos-stream' + _filepath.replace(this.pathService.resolve(UPLOAD_DIR_VIDEO), '');
      await this.s3Service.uploadFile({
        filename,
        filepath: _filepath,
        contentType: this.mimeService.getType(_filepath, 'video/mp4')
      });
    });

    await this.fileStorage.deleteDirectory(folderPath);
    await job.updateProgress(100);

    await this.mediaRepository.updateVideoStatus({ name: idName, status: EEncodingVideoStatus.SUCCESS });

    return { idName };
  }

  public run(connection: ConnectionOptions): Worker<IVideoStreamJobData, IVideoStreamJobResult> {
    const worker = new Worker<IVideoStreamJobData, IVideoStreamJobResult>(
      VIDEO_STREAM_QUEUE_NAME,
      this.processVideoStreamJob.bind(this),
      { connection, concurrency: 2 }
    );

    worker.on('progress', (job, progress) => {
      this.log.debug({ jobId: job.id, progress }, 'job progress');
    });

    worker.on('completed', (job) => {
      this.log.info({ jobId: job.id, idName: job.data.idName }, 'job completed');
    });

    worker.on('failed', async (job, err) => {
      const jobId = get(job, 'id', '');
      const idName = get(job, 'data.idName', '');
      const attemptsMade = get(job, 'attemptsMade', 0);
      const jobOptsAttempts = get(job, 'opts.attempts', 1);
      const message = get(err, 'message', '');
      this.log.error({ jobId, idName, attemptsMade, err }, 'job failed');
      if (job && attemptsMade >= jobOptsAttempts) {
        await this.mediaRepository
          .updateVideoStatus({ name: idName, status: EEncodingVideoStatus.FAILED, message: message })
          .catch(() => {});
      }
    });

    worker.on('error', (err) => {
      this.log.error({ err }, 'worker error');
    });

    return worker;
  }
}

/**
 * Giả sử:
 * dir = /stream/vid123
 * Trong đó có:
 * - master.m3u8
 * - v0/0.ts
 * - v0/1.ts
 * - sub/v1.ts
 * Thì output: [ "/stream/vid123/master.m3u8", "/stream/vid123/v0/0.ts", "/stream/vid123/v0/1.ts", "/stream/vid123/sub/v1.ts" ]
 */
async function getFiles({
  fileStorage,
  pathService,
  dir
}: {
  fileStorage: IFileStorage;
  pathService: IPathService;
  dir: string;
}): Promise<string[]> {
  const result: string[] = [];

  const walk = async (currentDir: string) => {
    const fileList = await fileStorage.readdir(currentDir);
    for (const file of fileList) {
      const fullPath = pathService.join(currentDir, file);
      const stat = await fileStorage.stat(fullPath);

      if (stat.isDirectory) {
        await walk(fullPath);
      } else {
        result.push(fullPath);
      }
    }
  };

  await walk(dir);
  return result;
}
