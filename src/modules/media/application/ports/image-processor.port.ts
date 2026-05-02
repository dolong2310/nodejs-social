export interface ImageProcessorPort {
  convertToJpeg(inputPath: string, outputPath: string): Promise<void>;
}
