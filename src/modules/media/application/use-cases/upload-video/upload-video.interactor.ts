import { mapWithConcurrency } from '@/modules/common/utils/concurrency.util';
import { FileStoragePort } from '@/modules/core/application/ports/file-storage.port';
import { StoragePort } from '@/modules/core/application/ports/storage.port';
import { EMediaType } from '@/modules/core/domain/enums/media.enum';
import {
  UploadVideoCommand,
  UploadVideoInPort,
  UploadVideoResult
} from '@/modules/media/application/use-cases/upload-video/upload-video.in-port';

export class UploadVideoInteractor extends UploadVideoInPort {
  constructor(
    private readonly s3Service: StoragePort,
    private readonly fileStorage: FileStoragePort
  ) {
    super();
  }

  async execute({ files }: UploadVideoCommand): Promise<UploadVideoResult[]> {
    return mapWithConcurrency(files, 2, async (file) => {
      const result = await this.s3Service.uploadFile({
        filename: `videos/${file.filename}`,
        filepath: file.filepath,
        contentType: this.fileStorage.getMimeType(file.filepath)
      });

      await this.fileStorage.delete(file.filepath);

      return new UploadVideoResult({
        url: result.url,
        type: EMediaType.VIDEO
      });
    });
  }
}
