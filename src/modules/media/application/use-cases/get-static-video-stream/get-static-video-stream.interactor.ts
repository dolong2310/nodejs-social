import { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import { RequestedRangeNotSatisfiableException } from '@/modules/media/application/media.exception';
import {
  GetStaticVideoStreamInPort,
  GetStaticVideoStreamQuery,
  GetStaticVideoStreamResult
} from '@/modules/media/application/use-cases/get-static-video-stream/get-static-video-stream.in-port';
import path from 'path';

export class GetStaticVideoStreamInteractor extends GetStaticVideoStreamInPort {
  constructor(private readonly fileStorage: FileStoragePort) {
    super();
  }

  async execute({ filename, rangeHeader }: GetStaticVideoStreamQuery): Promise<GetStaticVideoStreamResult> {
    if (!rangeHeader) {
      throw RequestedRangeNotSatisfiableException;
    }

    const videoPath = path.resolve('uploads/videos', filename);
    const { size: videoSize } = await this.fileStorage.stat(videoPath);

    const match = /^bytes=(\d+)-(\d*)$/i.exec(rangeHeader);
    if (!match) throw RequestedRangeNotSatisfiableException;

    const start = Number(match[1]);
    const endFromHeader = match[2] ? Number(match[2]) : null;

    if (!Number.isFinite(start) || start < 0 || start >= videoSize) {
      throw RequestedRangeNotSatisfiableException;
    }

    const chunkSize = 10 ** 6;
    const end =
      endFromHeader !== null && Number.isFinite(endFromHeader)
        ? Math.min(endFromHeader, videoSize - 1)
        : Math.min(start + chunkSize - 1, videoSize - 1);

    return new GetStaticVideoStreamResult({
      videoPath,
      videoSize,
      start,
      end,
      contentLength: end - start + 1,
      contentType: this.fileStorage.getMimeType(videoPath)
    });
  }
}
