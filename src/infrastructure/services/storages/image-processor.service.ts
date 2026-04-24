import { IImageProcessor } from '@/application/ports/image-processor.port';
import sharp from 'sharp';

export class SharpImageProcessor implements IImageProcessor {
  async convertToJpeg(inputPath: string, outputPath: string): Promise<void> {
    await sharp(inputPath).jpeg().toFile(outputPath);
  }
}
