import { EMediaType } from '@/modules/common/domain/enums/media.enum';
import { mapWithConcurrency } from '@/modules/common/utils/concurrency.util';
import { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import { ImageProcessorPort } from '@/modules/media/application/ports/image-processor.port';
import { ObjectStoragePort } from '@/modules/media/application/ports/object-storage.port';
import {
  UploadImageCommand,
  UploadImagePort,
  UploadImageResult
} from '@/modules/media/application/use-cases/upload-image/upload-image.port';
import path from 'path';

export class UploadImageUseCase extends UploadImagePort {
  constructor(
    private readonly s3Service: ObjectStoragePort,
    private readonly imageProcessor: ImageProcessorPort,
    private readonly fileStorage: FileStoragePort
  ) {
    super();
  }

  async execute({ files }: UploadImageCommand): Promise<UploadImageResult[]> {
    return mapWithConcurrency(files, 2, async (file) => {
      const newName = file.filename;
      const outputPath = path.resolve('uploads/images', `${newName}.jpg`);

      await this.imageProcessor.convertToJpeg(file.filepath, outputPath);

      const result = await this.s3Service.uploadFile({
        filename: `images/${newName}`,
        filepath: outputPath,
        contentType: this.fileStorage.getMimeType(outputPath)
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
