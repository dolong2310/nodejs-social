import { EnumMediaType } from '@/modules/common/domain/enums/media.enum';
import { mapWithConcurrency } from '@/modules/common/utils/concurrency.util';
import { VideoStreamQueuePort } from '@/modules/media/application/ports/video-stream-job.port';
import {
  UploadVideoStreamCommand,
  UploadVideoStreamPort,
  UploadVideoStreamResult
} from '@/modules/media/application/use-cases/upload-video-stream/upload-video-stream.port';
import { VideoStatusEntity } from '@/modules/media/domain/entities/video-status.entity';
import { EnumEncodingVideoStatus } from '@/modules/media/domain/entities/video-status.type';
import { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';

type UploadVideoStreamConfig = {
  clientUrl: string;
};

export class UploadVideoStreamUseCase extends UploadVideoStreamPort {
  constructor(
    private readonly mediaRepository: VideoStatusRepositoryPort,
    private readonly videoStreamQueue: VideoStreamQueuePort,
    private readonly uploadVideoStreamConfig: UploadVideoStreamConfig
  ) {
    super();
  }

  async execute({ files }: UploadVideoStreamCommand): Promise<UploadVideoStreamResult[]> {
    return mapWithConcurrency(files, 2, async (file) => {
      const idName = file.filename;

      const entity = VideoStatusEntity.create({
        name: idName,
        status: EnumEncodingVideoStatus.PENDING
      });
      await this.mediaRepository.insert(entity);

      void this.videoStreamQueue.add({ filepath: file.filepath, idName }).catch(async (err) => {
        await this.mediaRepository.updateVideoStatus({
          name: idName,
          status: EnumEncodingVideoStatus.FAILED,
          message: err instanceof Error ? err.message : 'Queue failed'
        });
      });

      return new UploadVideoStreamResult({
        url: `${this.uploadVideoStreamConfig.clientUrl}/static/videos-stream/${idName}/master.m3u8`,
        type: EnumMediaType.VIDEO_STREAM
      });
    });
  }
}
