import { EEncodingVideoStatus } from '@/domain/enums/media.enum';
import { IMediaRepository } from '@/domain/repositories/media/media.repository';

import { UPLOAD_DIR_VIDEO } from '@/presentation/http/constants/file.constant';
import { mapWithConcurrency } from '@/application/common/utils/concurrency.util';
import { encodeHLSWithMultipleVideoStreams } from '@/application/common/utils/video.util';
import { IFileStorage } from '@/application/ports/file-storage.port';
import { ILogger } from '@/application/ports/logger.port';
import { IMimeService } from '@/application/ports/mime.port';
import { IPathService } from '@/application/ports/path.port';
import { IS3Service } from '@/application/ports/s3.port';
import { IVideoHLSJobData, IVideoHLSJobResult } from '@/application/ports/video-hls-job.port';

import { VIDEO_HLS_QUEUE_NAME } from '@/infrastructure/queue/video-hls/video-hls.type';

import { Worker, type ConnectionOptions, type Job } from 'bullmq';
import { get } from 'lodash-es';

export interface IVideoHLSWorker {
  run(connection: ConnectionOptions): Worker<IVideoHLSJobData, IVideoHLSJobResult>;
}

// Consumer
export class VideoHLSWorker implements IVideoHLSWorker {
  private readonly log: ILogger;

  constructor(
    private readonly mediaRepository: IMediaRepository,
    private readonly s3Service: IS3Service,
    private readonly fileStorage: IFileStorage,
    private readonly mimeService: IMimeService,
    private readonly pathService: IPathService,
    private readonly logger: ILogger
  ) {
    this.log = this.logger.child({ module: 'video-hls-worker' });
  }

  private async processVideoHLSJob(job: Job<IVideoHLSJobData, IVideoHLSJobResult>): Promise<IVideoHLSJobResult> {
    const { filepath, idName } = job.data;

    await this.mediaRepository.updateVideoStatus({ name: idName, status: EEncodingVideoStatus.PROCESSING });
    await job.updateProgress(10);

    await encodeHLSWithMultipleVideoStreams(filepath);
    await job.updateProgress(60);

    await this.fileStorage.delete(filepath);

    const folderPath = this.pathService.resolve(UPLOAD_DIR_VIDEO, idName);
    const filepaths = await getFiles({ fileStorage: this.fileStorage, pathService: this.pathService, dir: folderPath });
    const concurrency = 2;

    // Upload các segment sang S3 với giới hạn concurrency để tránh bão hòa network/CPU.
    await mapWithConcurrency(filepaths, concurrency, async (_filepath) => {
      const filename = 'videos-hls' + _filepath.replace(this.pathService.resolve(UPLOAD_DIR_VIDEO), '');
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

  public run(connection: ConnectionOptions): Worker<IVideoHLSJobData, IVideoHLSJobResult> {
    const worker = new Worker<IVideoHLSJobData, IVideoHLSJobResult>(
      VIDEO_HLS_QUEUE_NAME,
      this.processVideoHLSJob.bind(this),
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
 * dir = /hls/vid123
 * Trong đó có:
 * - master.m3u8
 * - v0/0.ts
 * - v0/1.ts
 * - sub/v1.ts
 * Thì output: [ "/hls/vid123/master.m3u8", "/hls/vid123/v0/0.ts", "/hls/vid123/v0/1.ts", "/hls/vid123/sub/v1.ts" ]
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
