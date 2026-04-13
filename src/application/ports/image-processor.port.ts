export interface IImageProcessor {
  convertToJpeg(inputPath: string, outputPath: string): Promise<void>;
}
