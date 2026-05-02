import { mapWithConcurrency } from '@/modules/common/utils/concurrency.util';
import { IVideoStreamQueue } from '@/modules/core/application/ports/video-stream-job.port';
import {
  UploadVideoStreamCommand,
  UploadVideoStreamInPort,
  UploadVideoStreamResult
} from '@/modules/media/application/use-cases/upload-video-stream/upload-video-stream.in-port';
import { IAppConfig } from '@/bootstrap/types/app.type';
import { VideoStatusEntity } from '@/modules/media/domain/entities/video-status.entity';
import { EEncodingVideoStatus } from '@/modules/media/domain/entities/video-status.type';
import { EMediaType } from '@/modules/core/domain/enums/media.enum';
import { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';

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
