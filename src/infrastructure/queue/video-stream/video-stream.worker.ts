import { VIDEO_STREAM_QUEUE_NAME } from '@/infrastructure/queue/video-stream/video-stream.queue';
import { mapWithConcurrency } from '@/modules/common/utils/concurrency.util';
import { encodeStreamWithMultipleVideoStreams } from '@/modules/common/utils/video.util';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { StoragePort } from '@/modules/core/application/ports/storage.port';
import { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import { IVideoStreamJobData, IVideoStreamJobResult } from '@/modules/media/application/ports/video-stream-job.port';
import { EEncodingVideoStatus } from '@/modules/media/domain/entities/video-status.type';
import { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';
import { UPLOAD_DIR_VIDEO } from '@/presentation/http/express/constants/file.constant'; // TODO: move to infrastructure layer
import { Worker, type ConnectionOptions, type Job } from 'bullmq';
import { get } from 'lodash-es';
import path from 'path';

export interface IVideoStreamWorker {
  run(connection: ConnectionOptions): Worker<IVideoStreamJobData, IVideoStreamJobResult>;
}

// Consumer
export class VideoStreamWorker implements IVideoStreamWorker {
  private readonly log: LoggerPort;

  constructor(
    private readonly mediaRepository: VideoStatusRepositoryPort,
    private readonly s3Service: StoragePort,
    private readonly fileStorage: FileStoragePort,
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

    const folderPath = path.resolve(UPLOAD_DIR_VIDEO, idName);
    const filepaths = await getFiles({ fileStorage: this.fileStorage, dir: folderPath });
    const concurrency = 2;

    // Upload các segment sang S3 với giới hạn concurrency để tránh bão hòa network/CPU.
    await mapWithConcurrency(filepaths, concurrency, async (_filepath) => {
      const filename = 'videos-stream' + _filepath.replace(path.resolve(UPLOAD_DIR_VIDEO), '');
      await this.s3Service.uploadFile({
        filename,
        filepath: _filepath,
        contentType: this.fileStorage.getMimeType(_filepath, 'video/mp4')
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
          .catch((dbErr) => this.log.error({ err: dbErr, idName }, 'failed to mark video as FAILED in DB'));
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
async function getFiles({ fileStorage, dir }: { fileStorage: FileStoragePort; dir: string }): Promise<string[]> {
  const result: string[] = [];

  const walk = async (currentDir: string) => {
    const fileList = await fileStorage.readdir(currentDir);
    for (const file of fileList) {
      const fullPath = path.join(currentDir, file);
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
