import { UPLOAD_DIR_VIDEO } from '@/constants/file.constant';
import { IVideoHLSJobData } from '@/interfaces/types/media.type';
import { EEncodingVideoStatus } from '@/modules/media/media.enum';
import { IMediaRepository, MediaRepository } from '@/modules/media/media.repository';
import { Container } from '@/providers/container/instance.container';
import { LoggerInstance } from '@/providers/logger/instance.logger';
import { IVideoHLSJobResult, QUEUE_NAMES } from '@/providers/queue/types';
import { S3Service } from '@/shared/services/s3.service';
import { getFiles } from '@/utils/file.util';
import { encodeHLSWithMultipleVideoStreams } from '@/utils/video.util';
import { Worker, type ConnectionOptions, type Job } from 'bullmq';
import fs from 'fs/promises';
import { get } from 'lodash-es';
import mime from 'mime';
import path from 'path';

const log = LoggerInstance.getLogger().child({ module: 'video-hls-worker' });

export interface IVideoHLSWorker {
  createWorker(connection: ConnectionOptions): Worker<IVideoHLSJobData, IVideoHLSJobResult>;
}

// Consumer
export class VideoHLSWorker implements IVideoHLSWorker {
  private readonly s3Service = new S3Service();

  private get mediaRepository(): IMediaRepository {
    const container = Container.get();
    return container.get(MediaRepository);
  }

  private async processVideoHLSJob(job: Job<IVideoHLSJobData, IVideoHLSJobResult>): Promise<IVideoHLSJobResult> {
    const { filepath, idName } = job.data;

    await this.mediaRepository.updateVideoStatus({ name: idName, status: EEncodingVideoStatus.PROCESSING });
    await job.updateProgress(10);

    await encodeHLSWithMultipleVideoStreams(filepath);
    await job.updateProgress(60);

    await fs.unlink(filepath);

    const folderPath = path.resolve(UPLOAD_DIR_VIDEO, idName);
    const filepaths = getFiles(folderPath);

    await Promise.all(
      filepaths.map((_filepath) => {
        const filename = 'videos-hls' + _filepath.replace(path.resolve(UPLOAD_DIR_VIDEO), '');
        return this.s3Service.uploadFile({
          filename,
          filepath: _filepath,
          contentType: mime.getType(_filepath) ?? 'video/mp4'
        });
      })
    );

    await fs.rm(folderPath, { recursive: true, force: true });
    await job.updateProgress(100);

    await this.mediaRepository.updateVideoStatus({ name: idName, status: EEncodingVideoStatus.SUCCESS });

    return { idName };
  }

  public createWorker(connection: ConnectionOptions): Worker<IVideoHLSJobData, IVideoHLSJobResult> {
    const worker = new Worker<IVideoHLSJobData, IVideoHLSJobResult>(
      QUEUE_NAMES.VIDEO_HLS,
      this.processVideoHLSJob.bind(this),
      { connection, concurrency: 2 }
    );

    worker.on('progress', (job, progress) => {
      log.debug({ jobId: job.id, progress }, 'job progress');
    });

    worker.on('completed', (job) => {
      log.info({ jobId: job.id, idName: job.data.idName }, 'job completed');
    });

    worker.on('failed', async (job, err) => {
      const jobId = get(job, 'id', '');
      const idName = get(job, 'data.idName', '');
      const attemptsMade = get(job, 'attemptsMade', 0);
      const jobOptsAttempts = get(job, 'opts.attempts', 1);
      const message = get(err, 'message', '');
      log.error({ jobId, idName, attemptsMade, err }, 'job failed');
      if (job && attemptsMade >= jobOptsAttempts) {
        await this.mediaRepository
          .updateVideoStatus({ name: idName, status: EEncodingVideoStatus.FAILED, message: message })
          .catch(() => {});
      }
    });

    worker.on('error', (err) => {
      log.error({ err }, 'worker error');
    });

    return worker;
  }
}
