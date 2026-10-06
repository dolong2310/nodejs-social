import { mapWithConcurrency } from '@/modules/common/utils/concurrency.util';
import type { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import type { ObjectStoragePort } from '@/modules/media/application/ports/object-storage.port';
import type { VideoStreamEncoderPort } from '@/modules/media/application/ports/video-stream-encoder.port';
import {
  type EncodeVideoStreamInputPort,
  EncodeVideoStreamPort,
  EncodeVideoStreamOutputPort
} from '@/modules/media/application/use-cases/encode-video-stream/encode-video-stream.port';
import { EnumEncodingVideoStatus } from '@/modules/media/domain/entities/video-status.types';
import type { VideoStatusRepositoryPort } from '@/modules/media/domain/repositories/video-status.repository';

// Upload segments with a concurrency limit to avoid saturating network/CPU.
const UPLOAD_CONCURRENCY = 2;

export class EncodeVideoStreamUseCase extends EncodeVideoStreamPort {
  constructor(
    private readonly mediaRepository: VideoStatusRepositoryPort,
    private readonly videoStreamEncoder: VideoStreamEncoderPort,
    private readonly s3Service: ObjectStoragePort,
    private readonly fileStorage: FileStoragePort
  ) {
    super();
  }

  async execute(input: EncodeVideoStreamInputPort): Promise<EncodeVideoStreamOutputPort> {
    const { filepath, idName } = input;

    await this.mediaRepository.updateVideoStatus({ name: idName, status: EnumEncodingVideoStatus.PROCESSING });

    await this.videoStreamEncoder.encode(filepath);
    await this.fileStorage.delete(filepath);

    const { outputDir, files } = await this.videoStreamEncoder.listEncodedFiles(idName);
    await mapWithConcurrency(files, UPLOAD_CONCURRENCY, async (file) => {
      await this.s3Service.uploadFile({
        filename: `videos-stream/${file.key}`,
        filepath: file.filepath,
        contentType: this.fileStorage.getMimeType(file.filepath, 'video/mp4')
      });
    });
    await this.fileStorage.deleteDirectory(outputDir);

    await this.mediaRepository.updateVideoStatus({ name: idName, status: EnumEncodingVideoStatus.SUCCESS });

    return new EncodeVideoStreamOutputPort({ idName });
  }
}
