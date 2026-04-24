import { mapWithConcurrency } from '@/application/common/utils/concurrency.util';
import { IVideoStreamQueue } from '@/application/ports/video-stream-job.port';
import {
  UploadVideoStreamCommand,
  UploadVideoStreamInPort,
  UploadVideoStreamResult
} from '@/application/use-cases/media/upload-video-stream/upload-video-stream.in-port';
import { IAppConfig } from '@/bootstrap/types/app.type';
import { VideoStatusEntity } from '@/domain/entities/video-status/video-status.entity';
import { EEncodingVideoStatus } from '@/domain/entities/video-status/video-status.type';
import { EMediaType } from '@/domain/enums/media.enum';
import { VideoStatusRepositoryPort } from '@/domain/repositories/video-status/video-status.repository';

export class UploadVideoStreamInteractor extends UploadVideoStreamInPort {
  constructor(
    private readonly mediaRepository: VideoStatusRepositoryPort,
    private readonly videoStreamQueue: IVideoStreamQueue,
    private readonly appConfig: IAppConfig
  ) {
    super();
  }

  async execute({ files }: UploadVideoStreamCommand): Promise<UploadVideoStreamResult[]> {
    return mapWithConcurrency(files, 2, async (file) => {
      const idName = file.filename;

      const entity = VideoStatusEntity.create({
        name: idName,
        status: EEncodingVideoStatus.PENDING
      });
      await this.mediaRepository.insert(entity);

      void this.videoStreamQueue.add({ filepath: file.filepath, idName }).catch(async (err) => {
        await this.mediaRepository.updateVideoStatus({
          name: idName,
          status: EEncodingVideoStatus.FAILED,
          message: err instanceof Error ? err.message : 'Queue failed'
        });
      });

      return new UploadVideoStreamResult({
        url: `${this.appConfig.client.url}/static/videos-stream/${idName}/master.m3u8`,
        type: EMediaType.VIDEO_STREAM
      });
    });
  }
}
