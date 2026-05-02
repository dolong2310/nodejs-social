import { ImageProcessorPort } from '@/modules/core/application/ports/image-processor.port';
import sharp from 'sharp';

export class SharpImageProcessor implements ImageProcessorPort {
  async convertToJpeg(inputPath: string, outputPath: string): Promise<void> {
    await sharp(inputPath).jpeg().toFile(outputPath);
  }
}
