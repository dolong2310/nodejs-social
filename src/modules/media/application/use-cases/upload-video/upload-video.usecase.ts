import { EnumMediaType } from '@/modules/common/domain/enums/media.enum';
import { mapWithConcurrency } from '@/modules/common/utils/concurrency.util';
import { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import { ObjectStoragePort } from '@/modules/media/application/ports/object-storage.port';
import {
  UploadVideoCommand,
  UploadVideoPort,
  UploadVideoResult
} from '@/modules/media/application/use-cases/upload-video/upload-video.port';

export class UploadVideoUseCase extends UploadVideoPort {
  constructor(
    private readonly s3Service: ObjectStoragePort,
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
        type: EnumMediaType.VIDEO
      });
    });
  }
}
