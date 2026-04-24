import { RequestedRangeNotSatisfiableException } from '@/application/exceptions/media.exception';
import { IFileStorage } from '@/application/ports/file-storage.port';
import { IMimeService } from '@/application/ports/mime.port';
import { IPathService } from '@/application/ports/path.port';
import {
  GetStaticVideoStreamInPort,
  GetStaticVideoStreamQuery,
  GetStaticVideoStreamResult
} from '@/application/use-cases/media/get-static-video-stream/get-static-video-stream.in-port';

export class GetStaticVideoStreamInteractor extends GetStaticVideoStreamInPort {
  constructor(
    private readonly fileStorage: IFileStorage,
    private readonly mimeService: IMimeService,
    private readonly pathService: IPathService
  ) {
    super();
  }

  async execute({ filename, rangeHeader }: GetStaticVideoStreamQuery): Promise<GetStaticVideoStreamResult> {
    if (!rangeHeader) {
      throw RequestedRangeNotSatisfiableException;
    }

    const videoPath = this.pathService.resolve('uploads/videos', filename);
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
      contentType: this.mimeService.getType(videoPath)
    });
  }
}
