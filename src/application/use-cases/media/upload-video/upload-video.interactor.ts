import { mapWithConcurrency } from '@/application/common/utils/concurrency.util';
import { IFileStorage } from '@/application/ports/file-storage.port';
import { IMimeService } from '@/application/ports/mime.port';
import { IS3Service } from '@/application/ports/s3.port';
import {
  UploadVideoCommand,
  UploadVideoInPort,
  UploadVideoResult
} from '@/application/use-cases/media/upload-video/upload-video.in-port';
import { EMediaType } from '@/domain/enums/media.enum';

export class UploadVideoInteractor extends UploadVideoInPort {
  constructor(
    private readonly s3Service: IS3Service,
    private readonly fileStorage: IFileStorage,
    private readonly mimeService: IMimeService
  ) {
    super();
  }

  async execute({ files }: UploadVideoCommand): Promise<UploadVideoResult[]> {
    return mapWithConcurrency(files, 2, async (file) => {
      const result = await this.s3Service.uploadFile({
        filename: `videos/${file.filename}`,
        filepath: file.filepath,
        contentType: this.mimeService.getType(file.filepath)
      });

      await this.fileStorage.delete(file.filepath);

      return new UploadVideoResult({
        url: result.url,
        type: EMediaType.VIDEO
      });
    });
  }
}
