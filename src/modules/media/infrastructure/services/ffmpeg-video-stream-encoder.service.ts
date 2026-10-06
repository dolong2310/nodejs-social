import { encodeStreamWithMultipleVideoStreams } from '@/modules/common/utils/video.util';
import type { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import type {
  EncodedVideoStream,
  VideoStreamEncoderPort
} from '@/modules/media/application/ports/video-stream-encoder.port';
import path from 'path';

type FfmpegVideoStreamEncoderConfig = {
  outputRootDir: string;
};

export class FfmpegVideoStreamEncoder implements VideoStreamEncoderPort {
  constructor(
    private readonly fileStorage: FileStoragePort,
    private readonly config: FfmpegVideoStreamEncoderConfig
  ) {}

  async encode(filepath: string): Promise<void> {
    await encodeStreamWithMultipleVideoStreams(filepath);
  }

  async listEncodedFiles(idName: string): Promise<EncodedVideoStream> {
    const outputDir = path.resolve(this.config.outputRootDir, idName);
    const filepaths = await this.walk(outputDir);
    return {
      outputDir,
      files: filepaths.map((filepath) => ({
        filepath,
        key: path.relative(this.config.outputRootDir, filepath).split(path.sep).join('/')
      }))
    };
  }

  /**
   * Suppose:
   * dir = /stream/vid123
   * Which includes:
   * - master.m3u8
   * - v0/0.ts
   * - v0/1.ts
   * - sub/v1.ts
   * Then output is: [ "/stream/vid123/master.m3u8", "/stream/vid123/v0/0.ts", "/stream/vid123/v0/1.ts", "/stream/vid123/sub/v1.ts" ]
   */
  private async walk(dir: string): Promise<string[]> {
    const result: string[] = [];
    for (const file of await this.fileStorage.readdir(dir)) {
      const fullPath = path.join(dir, file);
      const stat = await this.fileStorage.stat(fullPath);
      if (stat.isDirectory) {
        result.push(...(await this.walk(fullPath)));
      } else {
        result.push(fullPath);
      }
    }
    return result;
  }
}
