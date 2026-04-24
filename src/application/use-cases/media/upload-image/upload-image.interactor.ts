import { mapWithConcurrency } from '@/application/common/utils/concurrency.util';
import { IFileStorage } from '@/application/ports/file-storage.port';
import { IImageProcessor } from '@/application/ports/image-processor.port';
import { IMimeService } from '@/application/ports/mime.port';
import { IPathService } from '@/application/ports/path.port';
import { IS3Service } from '@/application/ports/s3.port';
import {
  UploadImageCommand,
  UploadImageInPort,
  UploadImageResult
} from '@/application/use-cases/media/upload-image/upload-image.in-port';
import { EMediaType } from '@/domain/enums/media.enum';

export class UploadImageInteractor extends UploadImageInPort {
  constructor(
    private readonly s3Service: IS3Service,
    private readonly imageProcessor: IImageProcessor,
    private readonly fileStorage: IFileStorage,
    private readonly mimeService: IMimeService,
    private readonly pathService: IPathService
  ) {
    super();
  }

  async execute({ files }: UploadImageCommand): Promise<UploadImageResult[]> {
    return mapWithConcurrency(files, 2, async (file) => {
      const newName = file.filename;
      const outputPath = this.pathService.resolve('uploads/images', `${newName}.jpg`);

      await this.imageProcessor.convertToJpeg(file.filepath, outputPath);

      const result = await this.s3Service.uploadFile({
        filename: `images/${newName}`,
        filepath: outputPath,
        contentType: this.mimeService.getType(outputPath)
      });

      await this.fileStorage.delete(file.filepath);
      await this.fileStorage.delete(outputPath);

      return new UploadImageResult({
        url: result.url,
        type: EMediaType.IMAGE
      });
    });
  }
}
