import { BaseWorker } from '@/infrastructure/queue/bullmq/base.worker';
import { mapWithConcurrency } from '@/modules/common/utils/concurrency.util';
import { encodeStreamWithMultipleVideoStreams } from '@/modules/common/utils/video.util';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import { ObjectStoragePort } from '@/modules/media/application/ports/object-storage.port';
import { VideoStreamJobData, VideoStreamJobResult } from '@/modules/media/application/ports/video-stream-job.port';
import { EnumEncodingVideoStatus } from '@/modules/media/domain/entities/video-status.type';
import { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';
import { VIDEO_STREAM_QUEUE_NAME } from '@/modules/media/infrastructure/queue/video-stream.queue';
import { UPLOAD_DIR_VIDEO } from '@/presentation/http/express/constants/file.constant'; // TODO: move to infrastructure layer
import { type ConnectionOptions, type Job } from 'bullmq';
import { get } from 'lodash-es';
import path from 'path';

// Consumer
export class VideoStreamWorker extends BaseWorker<VideoStreamJobData, VideoStreamJobResult> {
  private readonly log: LoggerPort;

  constructor(
    protected readonly connection: ConnectionOptions,
    private readonly mediaRepository: VideoStatusRepositoryPort,
    private readonly s3Service: ObjectStoragePort,
    private readonly fileStorage: FileStoragePort,
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
      this.log.error({ jobId, idName, attemptsMade, err }, 'job failed');
      if (job && attemptsMade >= jobOptsAttempts) {
        await this.mediaRepository
          .updateVideoStatus({ name: idName, status: EnumEncodingVideoStatus.FAILED, message: message })
          .catch((dbErr) => this.log.error({ err: dbErr, idName }, 'failed to mark video as FAILED in DB'));
      }
    });
  }

  protected override async process(
    job: Job<VideoStreamJobData, VideoStreamJobResult, string>
  ): Promise<VideoStreamJobResult> {
    const { filepath, idName } = job.data;

    await this.mediaRepository.updateVideoStatus({ name: idName, status: EnumEncodingVideoStatus.PROCESSING });
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

    await this.mediaRepository.updateVideoStatus({ name: idName, status: EnumEncodingVideoStatus.SUCCESS });

    return { idName };
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
